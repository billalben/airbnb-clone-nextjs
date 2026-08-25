"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "./lib/db";
import { canDeleteHome, canEditHome, requireAdmin, requireUser } from "./lib/auth";
import {
  deleteHomeImages,
  uploadHomeImage,
} from "./lib/supabase/storage-server";
import {
  deleteKindeUser,
  kindeManagementEnabled,
} from "./lib/kinde-management";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  homeEditFormSchema,
  homeFormSchema,
} from "./lib/home-schema";

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
    image: formData.get("image") as File | undefined,
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
  values: NonNullable<
    Awaited<ReturnType<typeof readHomeFormData>>["values"]
  >;
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
    guests: String(values.guests),
    bedrooms: String(values.bedrooms),
    bathrooms: String(values.bathrooms),
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
    image: parsed.values?.image instanceof File ? parsed.values.image : undefined,
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
    image: parsed.values?.image instanceof File ? parsed.values.image : undefined,
    isEdit: true,
    existingHomeId: homeId,
  });
  if (result.ok) {
    redirect(`/my-homes/${homeId}/edit?toast=home_updated`);
  }
  return result;
}

function validateImage(file: File) {
  if (!file || file.size === 0) {
    throw new Error("Please select an image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Image must be JPEG, PNG, or WEBP.");
  }
}

// ---------------- Favorites ----------------

export async function addToFavorite(formData: FormData) {
  const user = await requireUser();
  const homeId = formData.get("homeId") as string;
  const pathName = formData.get("pathName") as string;

  if (!homeId || !pathName) {
    throw new Error("Home ID and Path Name are required.");
  }

  await prisma.favorite.create({
    data: { homeId, userId: user.id },
  });

  revalidatePath(pathName);
}

export async function DeleteFromFavorite(formData: FormData) {
  const user = await requireUser();
  const favoriteId = formData.get("favoriteId") as string;
  const pathName = formData.get("pathName") as string;

  if (!favoriteId || !pathName) {
    throw new Error("Favorite ID and Path Name are required.");
  }

  await prisma.favorite.delete({
    where: { id: favoriteId, userId: user.id },
  });

  revalidatePath(pathName);
}

// ---------------- Reservations ----------------

export async function createReservation(formData: FormData) {
  const user = await requireUser();
  const homeId = formData.get("homeId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!homeId || !startDate || !endDate) {
    throw new Error("Home ID, Start Date, and End Date are required.");
  }

  await prisma.reservation.create({
    data: {
      userId: user.id,
      endDate,
      startDate,
      homeId,
    },
  });

  return redirect("/?toast=reservation_created");
}

// ---------------- Delete home ----------------

export async function deleteHome(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  if (!homeId) throw new Error("Home ID is required.");

  const edit = await canDeleteHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const images = await prisma.homeImage.findMany({
    where: { homeId },
    select: { path: true },
  });
  const paths = images.map((i) => i.path);

  await prisma.home.delete({ where: { id: homeId } });

  try {
    await deleteHomeImages(paths);
  } catch (err) {
    console.error("Failed to delete some home images from storage:", err);
  }

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath("/");
  redirect("/my-homes?toast=home_deleted");
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

  const { newImageFiles, deleteImageIds, primaryImageKey } = payload;

  for (const file of newImageFiles) {
    validateImage(file);
  }

  const existingImages = await prisma.homeImage.findMany({
    where: { homeId },
    select: { id: true, path: true, isPrimary: true, position: true },
  });

  const validDeleteIds = new Set(
    existingImages
      .filter((img) => deleteImageIds.includes(img.id))
      .map((img) => img.id),
  );

  const deletions = existingImages.filter((img) => validDeleteIds.has(img.id));

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
      if (Number.isInteger(index) && index >= 0 && index < uploadedRows.length) {
        primaryImageId = uploadedRows[index].id;
      }
    } else if (validDeleteIds.has(primaryImageKey) === false) {
      const exists = existingImages.some((img) => img.id === primaryImageKey);
      if (exists) primaryImageId = primaryImageKey;
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

export async function deleteHomeImage(formData: FormData) {
  const imageId = formData.get("imageId") as string;
  const homeId = formData.get("homeId") as string;
  if (!imageId || !homeId) throw new Error("Image ID and Home ID are required.");

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const image = await prisma.homeImage.findUnique({
    where: { id: imageId },
    select: { id: true, path: true, isPrimary: true, homeId: true },
  });
  if (!image || image.homeId !== homeId) {
    throw new Error("Image not found.");
  }

  await prisma.homeImage.delete({ where: { id: imageId } });

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
}

export async function setPrimaryImage(formData: FormData) {
  const imageId = formData.get("imageId") as string;
  const homeId = formData.get("homeId") as string;
  if (!imageId || !homeId) throw new Error("Image ID and Home ID are required.");

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const image = await prisma.homeImage.findUnique({
    where: { id: imageId },
    select: { id: true, homeId: true },
  });
  if (!image || image.homeId !== homeId) {
    throw new Error("Image not found.");
  }

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

  revalidatePath(`/my-homes/${homeId}/edit`);
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath("/");
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

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID is required.");
  if (userId === admin.id) throw new Error("You cannot delete yourself.");

  const paths = await collectUserHomeImagePaths(userId);

  if (kindeManagementEnabled()) {
    try {
      await deleteKindeUser(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[deleteUser] Kinde delete failed for ${userId}:`, message);
      throw new Error(
        `Could not delete user in Kinde. Local delete aborted. ${message}\n` +
          `Fix: Kinde dashboard → M2M app → API → enable Kinde Management API.`,
      );
    }
  } else {
    console.warn(
      `[deleteUser] Skipping Kinde delete for ${userId}: M2M creds not configured.`,
    );
  }

  const result = await prisma.user.deleteMany({ where: { id: userId } });
  if (result.count === 0) return;

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
}

export async function deleteReservation(formData: FormData) {
  await requireAdmin();
  const reservationId = formData.get("reservationId") as string;
  if (!reservationId) throw new Error("Reservation ID is required.");
  await prisma.reservation.delete({ where: { id: reservationId } });
  revalidatePath("/admin/reservations");
  revalidatePath("/reservations");
}