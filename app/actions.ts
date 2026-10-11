"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "./lib/db";
import {
  canDeleteHome,
  canEditHome,
  canManageHome,
  requireAdmin,
  requireUser,
} from "./lib/auth";
import {
  deleteHomeImages,
  uploadHomeImage,
} from "./lib/supabase/storage-server";
import { getImageUrls } from "./lib/supabase/storage";
import {
  deleteKindeUser,
  kindeManagementEnabled,
} from "./lib/kinde-management";
import {
  MAX_IMAGES_PER_HOME,
  homeEditFormSchema,
  homeFormSchema,
  reservationSchema,
  updateHomeImagesSchema,
} from "./lib/home-schema";
import {
  clampCountArg,
  parseCountry,
  parseFilter,
} from "./lib/parseSearchParams";

type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

function buildFormData(
  values: Record<string, string | number | File | undefined>,
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "number") {
      formData.append(key, String(value));
    } else {
      formData.append(key, value);
    }
  }
  return formData;
}

async function readHomeFormData(formData: FormData, isEdit: boolean) {
  const schema = isEdit ? homeEditFormSchema : homeFormSchema;
  const raw = {
    categoryName: formData.get("categoryName")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    price: formData.get("price")?.toString() ?? "",
    image:
      formData.get("image") instanceof File
        ? (formData.get("image") as File)
        : undefined,
    guests: formData.get("guests")?.toString() ?? "",
    bedrooms: formData.get("bedrooms")?.toString() ?? "",
    bathrooms: formData.get("bathrooms")?.toString() ?? "",
    country: formData.get("country")?.toString() ?? "",
  };

  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      ok: false as const,
      fieldErrors,
      values: null,
    };
  }

  return { ok: true as const, values: result.data, formData: raw };
}

async function finalizeHomeSubmission({
  values,
  image,
  isEdit,
  existingHomeId,
}: {
  values: NonNullable<Awaited<ReturnType<typeof readHomeFormData>>["values"]>;
  image: File | undefined;
  isEdit: boolean;
  existingHomeId?: string;
}): Promise<ActionResult & { homeId?: string }> {
  const baseData = {
    categoryName: values.categoryName,
    title: values.title,
    description: values.description,
    price: values.price,
    country: values.country,
    guests: values.guests,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    addedCategory: true,
    addedDescription: true,
    addedLocation: true,
  };

  if (isEdit) {
    if (!existingHomeId) {
      return { ok: false, message: "Home ID is required." };
    }
    const edit = await canEditHome(existingHomeId);
    if (!edit) {
      return { ok: false, message: "Not allowed." };
    }

    if (image && image.size > 0) {
      const { path } = await uploadHomeImage(existingHomeId, image);
      const existingCount = await prisma.homeImage.count({
        where: { homeId: existingHomeId },
      });
      await prisma.$transaction([
        prisma.home.update({
          where: { id: existingHomeId },
          data: baseData,
        }),
        prisma.homeImage.create({
          data: {
            homeId: existingHomeId,
            path,
            isPrimary: existingCount === 0,
            position: existingCount,
          },
        }),
      ]);
    } else {
      await prisma.home.update({
        where: { id: existingHomeId },
        data: baseData,
      });
    }

    revalidatePath("/my-homes");
    revalidatePath("/admin/homes");
    revalidatePath(`/my-homes/${existingHomeId}/edit`);
    revalidatePath(`/home/${existingHomeId}`);
    revalidatePath("/");
    return { ok: true, homeId: existingHomeId };
  }

  // Create flow: image is required by the schema, so it must exist here.
  if (!image) {
    return { ok: false, fieldErrors: { image: ["Please choose an image."] } };
  }
  const user = await requireUser();

  const created = await prisma.home.create({
    data: {
      ...baseData,
      userId: user.id,
    },
  });

  const { path } = await uploadHomeImage(created.id, image);
  await prisma.homeImage.create({
    data: {
      homeId: created.id,
      path,
      isPrimary: true,
      position: 0,
    },
  });

  revalidatePath("/");
  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  return { ok: true, homeId: created.id };
}

export async function createHome(
  values: Record<string, string | number | File | undefined>,
): Promise<ActionResult> {
  const formData = buildFormData(values);
  const parsed = await readHomeFormData(formData, false);
  if (!parsed.ok) {
    return { ok: false, fieldErrors: parsed.fieldErrors };
  }
  const result = await finalizeHomeSubmission({
    values: parsed.values,
    image:
      parsed.values?.image instanceof File ? parsed.values.image : undefined,
    isEdit: false,
  });
  if (result.ok) {
    redirect("/?toast=home_created");
  }
  return result;
}

export async function updateHome(
  homeId: string,
  values: Record<string, string | number | File | undefined>,
): Promise<ActionResult> {
  const formData = buildFormData(values);
  const parsed = await readHomeFormData(formData, true);
  if (!parsed.ok) {
    return { ok: false, fieldErrors: parsed.fieldErrors };
  }

  const result = await finalizeHomeSubmission({
    values: parsed.values,
    image:
      parsed.values?.image instanceof File ? parsed.values.image : undefined,
    isEdit: true,
    existingHomeId: homeId,
  });

  if (result.ok) {
    redirect(`/home/${homeId}?toast=home_updated`);
  }

  return result;
}

// ---------------- Favorites ----------------

export async function addToFavorite(formData: FormData) {
  const user = await requireUser();
  const homeId = formData.get("homeId") as string;
  const pathName = formData.get("pathName") as string;

  if (!homeId || !pathName) {
    throw new Error("Home ID and Path Name are required.");
  }

  const existing = await prisma.favorite.findFirst({
    where: { userId: user.id, homeId },
    select: { id: true },
  });
  if (!existing) {
    try {
      await prisma.favorite.create({
        data: { homeId, userId: user.id },
      });
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code !== "P2002") throw err;
    }
  }

  revalidatePath(pathName);
}

export async function DeleteFromFavorite(formData: FormData) {
  const user = await requireUser();
  const homeId = formData.get("homeId") as string;
  const pathName = formData.get("pathName") as string;

  if (!homeId || !pathName) {
    throw new Error("Home ID and Path Name are required.");
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, homeId },
  });

  revalidatePath(pathName);
}

export async function toggleFavorite(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const homeId = formData.get("homeId") as string;
  const pathName = formData.get("pathName") as string;

  if (!homeId || !pathName) {
    return { ok: false, message: "Could not update favorites." };
  }

  const existing = await prisma.favorite.findFirst({
    where: { userId: user.id, homeId },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.deleteMany({
      where: { userId: user.id, homeId },
    });
  } else {
    try {
      await prisma.favorite.create({
        data: { homeId, userId: user.id },
      });
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code !== "P2002") {
        console.error("[toggleFavorite] failed:", err);
        return { ok: false, message: "Could not update favorites." };
      }
    }
  }

  revalidatePath(pathName);
  return { ok: true };
}

// ---------------- Pagination: load more homes ----------------

export type LoadMoreHomesFilters = {
  filter?: string;
  country?: string;
  guest?: number;
  room?: number;
  bathroom?: number;
};

export type LoadMoreHomeItem = {
  id: string;
  title: string | null;
  price: number | null;
  description: string | null;
  country: string | null;
  imageUrls: (string | null)[];
  isInFavoriteList: boolean;
};

const MAX_SKIP = 10000;

export async function loadMoreHomes({
  skip,
  filter,
  country,
  guest,
  room,
  bathroom,
}: { skip: number } & LoadMoreHomesFilters): Promise<LoadMoreHomeItem[]> {
  await connection();

  if (!Number.isInteger(skip) || skip < 0 || skip > MAX_SKIP) {
    return [];
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const homes = await prisma.home.findMany({
    where: {
      addedCategory: true,
      addedLocation: true,
      addedDescription: true,
      categoryName: parseFilter(filter),
      country: parseCountry(country),
      guests: clampCountArg(guest),
      bedrooms: clampCountArg(room),
      bathrooms: clampCountArg(bathroom),
    },
    orderBy: { createdAT: "desc" },
    skip,
    take: 10,
    select: {
      id: true,
      title: true,
      price: true,
      description: true,
      country: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        select: { path: true },
      },
      Favorite: {
        where: { userId: user?.id },
        select: { id: true },
        take: 1,
      },
    },
  });

  const allPaths = homes.flatMap((h) => h.images.map((i) => i.path));
  const urls = await getImageUrls(allPaths);
  let cursor = 0;

  return homes.map((h) => {
    const homeUrls = h.images.map(() => urls[cursor++] ?? null);
    return {
      id: h.id,
      title: h.title,
      price: h.price,
      description: h.description,
      country: h.country,
      imageUrls: homeUrls,
      isInFavoriteList: (h.Favorite[0]?.id ?? null) !== null,
    };
  });
}

// ---------------- Reservations ----------------

export async function createReservation(formData: FormData) {
  const user = await requireUser();
  const rawHomeId = formData.get("homeId")?.toString() ?? "";

  const parsed = reservationSchema.safeParse({
    homeId: rawHomeId,
    startDate: formData.get("startDate")?.toString() ?? "",
    endDate: formData.get("endDate")?.toString() ?? "",
  });

  if (!parsed.success) {
    redirect(
      rawHomeId
        ? `/home/${rawHomeId}?toast=reservation_invalid_dates`
        : "/",
    );
  }

  const { homeId, startDate, endDate } = parsed.data;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, userId: true },
  });
  if (!home) {
    redirect("/?toast=reservation_error");
  }

  if (home.userId === user.id) {
    redirect(`/home/${home.id}?toast=reservation_own_home`);
  }

  const overlap = await prisma.reservation.findFirst({
    where: {
      homeId: home.id,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });
  if (overlap) {
    redirect(`/home/${home.id}?toast=reservation_unavailable`);
  }

  await prisma.reservation.create({
    data: {
      userId: user.id,
      homeId: home.id,
      startDate,
      endDate,
    },
  });

  return redirect("/?toast=reservation_created");
}

// ---------------- Delete home ----------------

export async function deleteHome(formData: FormData): Promise<ActionResult> {
  const homeId = formData.get("homeId") as string;
  if (!homeId) return { ok: false, message: "Home ID is required." };

  const edit = await canDeleteHome(homeId);
  if (!edit) return { ok: false, message: "Not allowed." };

  const images = await prisma.homeImage.findMany({
    where: { homeId },
    select: { path: true },
  });
  const paths = images.map((i) => i.path);

  try {
    await prisma.home.delete({ where: { id: homeId } });
  } catch (err) {
    console.error("[deleteHome] delete failed:", err);
    return { ok: false, message: "Could not delete home." };
  }

  try {
    await deleteHomeImages(paths);
  } catch (err) {
    console.error("Failed to delete some home images from storage:", err);
  }

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath("/");
  return { ok: true };
}

// ---------------- Home images (owner only) ----------------

export async function updateHomeImages(
  homeId: string,
  payload: {
    newImageFiles: File[];
    deleteImageIds: string[];
    primaryImageKey: string | null;
  },
): Promise<ActionResult> {
  const edit = await canEditHome(homeId);
  if (!edit) {
    return { ok: false, message: "Not allowed." };
  }

  const parsedPayload = updateHomeImagesSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { ok: false, message: "Invalid photo data." };
  }

  const { newImageFiles, deleteImageIds, primaryImageKey } = parsedPayload.data;

  const existingImages = await prisma.homeImage.findMany({
    where: { homeId },
    select: { id: true, path: true, isPrimary: true, position: true },
  });

  const validDeleteIds = new Set(
    existingImages
      .filter((img) => deleteImageIds.includes(img.id))
      .map((img) => img.id),
  );

  const remainingExisting = existingImages.filter(
    (img) => !validDeleteIds.has(img.id),
  );

  const deletions = existingImages.filter((img) => validDeleteIds.has(img.id));

  const remainingCount = remainingExisting.length + newImageFiles.length;
  if (remainingCount === 0) {
    return { ok: false, message: "A home must have at least one photo." };
  }
  if (remainingCount > MAX_IMAGES_PER_HOME) {
    return {
      ok: false,
      message: `A home can have at most ${MAX_IMAGES_PER_HOME} photos.`,
    };
  }

  if (
    primaryImageKey &&
    !primaryImageKey.startsWith("new-") &&
    validDeleteIds.has(primaryImageKey)
  ) {
    return {
      ok: false,
      message: "You cannot remove the primary photo.",
    };
  }

  const uploadedRows: { id: string }[] = [];
  if (newImageFiles.length > 0) {
    const basePosition = await prisma.homeImage.count({ where: { homeId } });
    for (const [index, file] of newImageFiles.entries()) {
      const { path } = await uploadHomeImage(homeId, file);
      const created = await prisma.homeImage.create({
        data: {
          homeId,
          path,
          isPrimary: false,
          position: basePosition + index,
        },
        select: { id: true },
      });
      uploadedRows.push(created);
    }
  }

  let primaryImageId: string | null = null;
  if (primaryImageKey) {
    if (primaryImageKey.startsWith("new-")) {
      const index = Number(primaryImageKey.slice(4));
      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < uploadedRows.length
      ) {
        primaryImageId = uploadedRows[index].id;
      }
    } else if (remainingExisting.some((img) => img.id === primaryImageKey)) {
      primaryImageId = primaryImageKey;
    }
  }

  if (!primaryImageId) {
    const currentPrimary = existingImages.find((img) => img.isPrimary);
    if (
      currentPrimary &&
      remainingExisting.some((i) => i.id === currentPrimary.id)
    ) {
      primaryImageId = currentPrimary.id;
    } else {
      const firstRemaining = remainingExisting[0] ?? uploadedRows[0];
      primaryImageId = firstRemaining?.id ?? null;
    }
  }

  if (primaryImageId) {
    await prisma.$transaction([
      prisma.homeImage.updateMany({
        where: { homeId },
        data: { isPrimary: false },
      }),
      prisma.homeImage.update({
        where: { id: primaryImageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  if (deletions.length > 0) {
    await prisma.homeImage.deleteMany({
      where: { id: { in: deletions.map((img) => img.id) } },
    });
    try {
      await deleteHomeImages(deletions.map((img) => img.path));
    } catch (err) {
      console.error("Failed to delete some images from storage:", err);
    }
  }

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath(`/my-homes/${homeId}/edit`);
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteHomeImage(
  formData: FormData,
): Promise<ActionResult> {
  const imageId = formData.get("imageId") as string;
  const homeId = formData.get("homeId") as string;
  if (!imageId || !homeId) {
    return { ok: false, message: "Image ID and Home ID are required." };
  }

  const edit = await canManageHome(homeId);
  if (!edit) return { ok: false, message: "Not allowed." };

  const image = await prisma.homeImage.findUnique({
    where: { id: imageId },
    select: { id: true, path: true, isPrimary: true, homeId: true },
  });
  if (!image || image.homeId !== homeId) {
    return { ok: false, message: "Image not found." };
  }

  try {
    await prisma.homeImage.delete({ where: { id: imageId } });
  } catch (err) {
    console.error("[deleteHomeImage] delete failed:", err);
    return { ok: false, message: "Could not delete photo." };
  }

  if (image.isPrimary) {
    const next = await prisma.homeImage.findFirst({
      where: { homeId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.homeImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  try {
    await deleteHomeImages([image.path]);
  } catch (err) {
    console.error("Failed to delete image from storage:", err);
  }

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath(`/my-homes/${homeId}/edit`);
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function setPrimaryImage(
  formData: FormData,
): Promise<ActionResult> {
  const imageId = formData.get("imageId") as string;
  const homeId = formData.get("homeId") as string;
  if (!imageId || !homeId) {
    return { ok: false, message: "Image ID and Home ID are required." };
  }

  const edit = await canManageHome(homeId);
  if (!edit) return { ok: false, message: "Not allowed." };

  const image = await prisma.homeImage.findUnique({
    where: { id: imageId },
    select: { id: true, homeId: true },
  });
  if (!image || image.homeId !== homeId) {
    return { ok: false, message: "Image not found." };
  }

  try {
    await prisma.$transaction([
      prisma.homeImage.updateMany({
        where: { homeId },
        data: { isPrimary: false },
      }),
      prisma.homeImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
  } catch (err) {
    console.error("[setPrimaryImage] update failed:", err);
    return { ok: false, message: "Could not update primary photo." };
  }

  revalidatePath(`/my-homes/${homeId}/edit`);
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath("/");
  return { ok: true };
}

// ---------------- Admin actions ----------------

async function collectUserHomeImagePaths(userId: string): Promise<string[]> {
  const homes = await prisma.home.findMany({
    where: { userId },
    select: { id: true },
  });
  if (homes.length === 0) return [];
  const images = await prisma.homeImage.findMany({
    where: { homeId: { in: homes.map((h) => h.id) } },
    select: { path: true },
  });
  return images.map((i) => i.path);
}

export async function deleteUser(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) return { ok: false, message: "User ID is required." };
  if (userId === admin.id) {
    return { ok: false, message: "You cannot delete yourself." };
  }

  const paths = await collectUserHomeImagePaths(userId);

  if (kindeManagementEnabled()) {
    try {
      await deleteKindeUser(userId);
    } catch (err) {
      console.error(`[deleteUser] Kinde delete failed for ${userId}:`, err);
      return { ok: false, message: "Could not delete user. Please try again." };
    }
  } else {
    console.warn(
      `[deleteUser] Skipping Kinde delete for ${userId}: M2M creds not configured.`,
    );
  }

  const result = await prisma.user.deleteMany({ where: { id: userId } });
  if (result.count === 0) {
    return { ok: false, message: "User not found." };
  }

  if (paths.length > 0) {
    try {
      await deleteHomeImages(paths);
    } catch (err) {
      console.error(`[deleteUser] Storage cleanup failed for ${userId}:`, err);
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/homes");
  revalidatePath("/admin/reservations");
  revalidatePath("/");
  revalidatePath("/my-homes");
  revalidatePath("/favorites");
  revalidatePath("/reservations");
  return { ok: true };
}

export async function deleteReservation(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const reservationId = formData.get("reservationId") as string;
  if (!reservationId) {
    return { ok: false, message: "Reservation ID is required." };
  }

  try {
    await prisma.reservation.delete({ where: { id: reservationId } });
  } catch (err) {
    console.error("[deleteReservation] delete failed:", err);
    return { ok: false, message: "Could not delete reservation." };
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/reservations");
  return { ok: true };
}
