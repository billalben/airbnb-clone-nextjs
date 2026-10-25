"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../lib/db";
import {
  canDeleteHome,
  canEditHome,
  canManageHome,
  requireUser,
} from "../lib/auth";
import {
  deleteHomeImages,
  uploadHomeImage,
} from "../lib/supabase/storage-server";
import {
  MAX_IMAGES_PER_HOME,
  homeEditFormSchema,
  homeFormSchema,
  updateHomeImagesSchema,
  type HomeFormInput,
  type HomeFormValues,
} from "../lib/home-schema";
import {
  clampCountArg,
  parseCountry,
  parseFilter,
} from "../lib/parseSearchParams";
import { findHomeCards, type HomeCardData } from "../lib/home-cards";
import type { ActionResult } from "../lib/action-result";

function parseHomeForm(values: HomeFormInput, isEdit: boolean) {
  const schema = isEdit ? homeEditFormSchema : homeFormSchema;
  const result = schema.safeParse({
    categoryName: values.categoryName ?? "",
    title: values.title ?? "",
    description: values.description ?? "",
    price: values.price,
    image: values.image instanceof File ? values.image : undefined,
    guests: values.guests,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    country: values.country ?? "",
  });

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false as const, fieldErrors, values: null };
  }

  return { ok: true as const, values: result.data, fieldErrors: null };
}

async function finalizeHomeSubmission({
  values,
  image,
  isEdit,
  existingHomeId,
}: {
  values: HomeFormValues;
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
      let uploadedPath: string | null = null;
      try {
        const upload = await uploadHomeImage(existingHomeId, image);
        uploadedPath = upload.path;

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
              path: upload.path,
              isPrimary: existingCount === 0,
              position: existingCount,
            },
          }),
        ]);
      } catch (err) {
        console.error("[finalizeHomeSubmission] edit failed:", err);
        if (uploadedPath) {
          await deleteHomeImages([uploadedPath]).catch((cleanupError) =>
            console.error(
              "[finalizeHomeSubmission] image cleanup failed:",
              cleanupError,
            ),
          );
        }
        return { ok: false, message: "Could not update home. Please try again." };
      }
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

  let uploadedPath: string | null = null;
  try {
    const upload = await uploadHomeImage(created.id, image);
    uploadedPath = upload.path;

    await prisma.homeImage.create({
      data: {
        homeId: created.id,
        path: upload.path,
        isPrimary: true,
        position: 0,
      },
    });
  } catch (err) {
    console.error("[finalizeHomeSubmission] create failed:", err);
    if (uploadedPath) {
      await deleteHomeImages([uploadedPath]).catch((cleanupError) =>
        console.error(
          "[finalizeHomeSubmission] image cleanup failed:",
          cleanupError,
        ),
      );
    }
    await prisma.home.delete({ where: { id: created.id } }).catch(
      (cleanupError) =>
        console.error(
          "[finalizeHomeSubmission] home cleanup failed:",
          cleanupError,
        ),
    );
    return { ok: false, message: "Could not create home. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  return { ok: true, homeId: created.id };
}

export async function createHome(values: HomeFormInput): Promise<ActionResult> {
  const parsed = parseHomeForm(values, false);
  if (!parsed.ok) {
    return { ok: false, fieldErrors: parsed.fieldErrors };
  }

  const result = await finalizeHomeSubmission({
    values: parsed.values,
    image: parsed.values.image,
    isEdit: false,
  });
  if (result.ok) {
    redirect("/?toast=home_created");
  }
  return result;
}

export async function updateHome(
  homeId: string,
  values: HomeFormInput,
): Promise<ActionResult> {
  const parsed = parseHomeForm(values, true);
  if (!parsed.ok) {
    return { ok: false, fieldErrors: parsed.fieldErrors };
  }

  const result = await finalizeHomeSubmission({
    values: parsed.values,
    image: parsed.values.image,
    isEdit: true,
    existingHomeId: homeId,
  });

  if (result.ok) {
    redirect(`/home/${homeId}?toast=home_updated`);
  }

  return result;
}

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

  let uploadedRows: { id: string }[] = [];
  if (newImageFiles.length > 0) {
    const basePosition = await prisma.homeImage.count({ where: { homeId } });

    // Upload in parallel, but wait for every upload to settle so cleanup never
    // races an in-flight request.
    const results = await Promise.allSettled(
      newImageFiles.map(async (file, index) => {
        const { path } = await uploadHomeImage(homeId, file);
        return { path, position: basePosition + index };
      }),
    );

    const uploads = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (uploads.length !== newImageFiles.length) {
      console.error(
        "[updateHomeImages] upload failed:",
        results.find((result) => result.status === "rejected"),
      );
      await deleteHomeImages(uploads.map((upload) => upload.path)).catch(
        (cleanupError) =>
          console.error("[updateHomeImages] image cleanup failed:", cleanupError),
      );
      return { ok: false, message: "Could not upload photos. Please try again." };
    }

    try {
      uploadedRows = await prisma.$transaction(
        uploads.map((upload) =>
          prisma.homeImage.create({
            data: {
              homeId,
              path: upload.path,
              isPrimary: false,
              position: upload.position,
            },
            select: { id: true },
          }),
        ),
      );
    } catch (err) {
      console.error("[updateHomeImages] row creation failed:", err);
      await deleteHomeImages(uploads.map((upload) => upload.path)).catch(
        (cleanupError) =>
          console.error("[updateHomeImages] image cleanup failed:", cleanupError),
      );
      return { ok: false, message: "Could not upload photos. Please try again." };
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

// ---------------- Pagination: load more homes ----------------

export type LoadMoreHomesFilters = {
  filter?: string;
  country?: string;
  guest?: number;
  room?: number;
  bathroom?: number;
};

const MAX_SKIP = 10000;

export async function loadMoreHomes({
  skip,
  filter,
  country,
  guest,
  room,
  bathroom,
}: { skip: number } & LoadMoreHomesFilters): Promise<HomeCardData[]> {
  await connection();

  if (!Number.isInteger(skip) || skip < 0 || skip > MAX_SKIP) {
    return [];
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return findHomeCards({
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
    userId: user?.id,
    take: 10,
    skip,
  });
}
