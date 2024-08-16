"use server";

import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { supabase } from "./lib/supabase";
import { revalidatePath } from "next/cache";

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

  const { data: imageData } = await supabase.storage
    .from("images")
    .upload(`${imageFile.name}-${new Date()}`, imageFile, {
      cacheControl: "216000", // 1 month
      contentType: "image/png",
    });

  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      title: title,
      description: description,
      price: Number(price),
      bedrooms: roomNumber,
      bathrooms: bathroomsNumber,
      guests: guestNumber,
      photo: imageData?.path,
      addedDescription: true,
    },
  });

  return redirect(`/create/${homeId}/address`);
}

export async function createLocation(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const countryValue = formData.get("countryValue") as string;

  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      addedLocation: true,
      country: countryValue,
    },
  });

  return redirect("/");
}

export async function addToFavorite(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const userId = formData.get("userId") as string;
  const pathName = formData.get("pathName") as string;

  if (!homeId || !userId || !pathName) {
    throw new Error("Home ID, User ID, and Path Name are required.");
  }

  await prisma.favorite.create({
    data: {
      homeId: homeId,
      userId: userId,
    },
  });

  revalidatePath(pathName);
}

export async function DeleteFromFavorite(formData: FormData) {
  const favoriteId = formData.get("favoriteId") as string;
  const pathName = formData.get("pathName") as string;
  const userId = formData.get("userId") as string;

  if (!favoriteId || !pathName || !userId) {
    throw new Error("Favorite ID, Path Name, and User ID are required.");
  }

  await prisma.favorite.delete({
    where: {
      id: favoriteId,
      userId: userId,
    },
  });

  revalidatePath(pathName);
}

export async function createReservation(formData: FormData) {
  const userId = formData.get("userId") as string;
  const homeId = formData.get("homeId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!userId || !homeId || !startDate || !endDate) {
    throw new Error("User ID, Home ID, Start Date, and End Date are required.");
  }

  await prisma.reservation.create({
    data: {
      userId: userId,
      endDate: endDate,
      startDate: startDate,
      homeId: homeId,
    },
  });

  return redirect("/");
}
