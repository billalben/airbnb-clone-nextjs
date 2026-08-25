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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

export async function createAirbnbHome({ userId }: { userId: string }) {
  if (!userId) throw new Error("User ID is required.");

  const existingHome = await prisma.home.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAT: "desc",
    },
  });

  if (!existingHome) {
    const data = await prisma.home.create({
      data: {
        userId,
      },
    });

    return redirect(`/create/${data.id}/structure`);
  }

  if (!existingHome.addedCategory) {
    return redirect(`/create/${existingHome.id}/structure`);
  } else if (!existingHome.addedDescription) {
    return redirect(`/create/${existingHome.id}/description`);
  } else if (!existingHome.addedLocation) {
    return redirect(`/create/${existingHome.id}/address`);
  }

  const data = await prisma.home.create({
    data: {
      userId,
    },
  });

  return redirect(`/create/${data.id}/structure`);
}

export async function createCategoryPage(formData: FormData) {
  const categoryName = formData.get("categoryName") as string;
  const homeId = formData.get("homeId") as string;

  if (!categoryName || !homeId) {
    throw new Error("Category name and home ID are required.");
  }

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      categoryName: categoryName,
      addedCategory: true,
    },
  });

  return redirect(`/create/${homeId}/description`);
}

export async function CreateDescription(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price");
  const imageFile = formData.get("image") as File;
  const homeId = formData.get("homeId") as string;

  const guestNumber = formData.get("guest") as string;
  const roomNumber = formData.get("room") as string;
  const bathroomsNumber = formData.get("bathroom") as string;

  if (
    !title ||
    !description ||
    !price ||
    !imageFile ||
    !homeId ||
    !guestNumber ||
    !roomNumber ||
    !bathroomsNumber
  ) {
    throw new Error("All fields are required.");
  }

  validateImage(imageFile);

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const { path } = await uploadHomeImage(homeId, imageFile);

  await prisma.$transaction([
    prisma.homeImage.create({
      data: {
        homeId,
        path,
        isPrimary: true,
        position: 0,
      },
    }),
    prisma.home.update({
      where: { id: homeId },
      data: {
        title,
        description,
        price: Number(price),
        bedrooms: roomNumber,
        bathrooms: bathroomsNumber,
        guests: guestNumber,
        addedDescription: true,
      },
    }),
  ]);

  return redirect(`/create/${homeId}/address`);
}

export async function createLocation(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const countryValue = formData.get("countryValue") as string;

  if (!homeId || !countryValue) {
    throw new Error("Home ID and country are required.");
  }

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  await prisma.home.update({
    where: { id: homeId },
    data: { addedLocation: true, country: countryValue },
  });

  return redirect("/");
}

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

  return redirect("/");
}

// ---------------- Edit / Delete home (owner or admin) ----------------

export async function updateHome(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  if (!homeId) throw new Error("Home ID is required.");

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priceRaw = formData.get("price") as string;
  const categoryName = (formData.get("categoryName") as string)?.trim();
  const country = (formData.get("country") as string)?.trim();
  const guests = formData.get("guest") as string;
  const bedrooms = formData.get("room") as string;
  const bathrooms = formData.get("bathroom") as string;

  if (
    !title ||
    !description ||
    !priceRaw ||
    !categoryName ||
    !country ||
    !guests ||
    !bedrooms ||
    !bathrooms
  ) {
    throw new Error("All fields are required.");
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 10) {
    throw new Error("Price must be at least 10.");
  }

  await prisma.home.update({
    where: { id: homeId },
    data: {
      title,
      description,
      price,
      categoryName,
      country,
      guests,
      bedrooms,
      bathrooms,
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
    },
  });

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/");
  redirect(`/my-homes/${homeId}/edit?success=1`);
}

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

  // Delete storage objects after DB row is gone.
  // A failure here will leave orphaned files but won't leave orphaned DB rows.
  try {
    await deleteHomeImages(paths);
  } catch (err) {
    console.error("Failed to delete some home images from storage:", err);
  }

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath("/");
  redirect("/my-homes");
}

// ---------------- Home images (owner or admin) ----------------

export async function addHomeImage(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  if (!homeId) throw new Error("Home ID is required.");

  const edit = await canEditHome(homeId);
  if (!edit) throw new Error("Not allowed.");

  const file = formData.get("image") as File;
  validateImage(file);

  const { path } = await uploadHomeImage(homeId, file);

  // First image becomes primary
  const existingCount = await prisma.homeImage.count({ where: { homeId } });

  await prisma.homeImage.create({
    data: {
      homeId,
      path,
      isPrimary: existingCount === 0,
      position: existingCount,
    },
  });

  revalidatePath("/my-homes");
  revalidatePath("/admin/homes");
  revalidatePath(`/my-homes/${homeId}/edit`);
  revalidatePath(`/home/${homeId}`);
  revalidatePath("/");
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

  // If we deleted the primary, promote the next image (by position) to primary.
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

  // 1. Snapshot storage paths BEFORE the DB cascade removes the HomeImage rows.
  const paths = await collectUserHomeImagePaths(userId);

  // 2. Delete from Kinde first. Failure here aborts everything — we never
  //    want to delete from the local DB while leaving an orphan in Kinde.
  //    If M2M creds aren't configured we still proceed locally so admins
  //    aren't blocked, but log a warning so the Kinde account doesn't get
  //    forgotten.
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

  // 3. Local DB. deleteMany (not delete) so a re-run after a Kinde 404
  //    doesn't throw P2025. Cascade handles favorites / reservations /
  //    HomeImage rows.
  const result = await prisma.user.deleteMany({ where: { id: userId } });
  if (result.count === 0) return;

  // 4. Best-effort storage cleanup. A failure here only leaves orphaned
  //    files in the bucket, never orphaned DB rows.
  if (paths.length > 0) {
    try {
      await deleteHomeImages(paths);
    } catch (err) {
      console.error(`[deleteUser] Storage cleanup failed for ${userId}:`, err);
    }
  }

  // 5. Revalidate every route that could have surfaced this user's data.
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
