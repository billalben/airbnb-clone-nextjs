"use server";

import { revalidatePath } from "next/cache";
import prisma from "../lib/db";
import { requireAdmin } from "../lib/auth";
import { deleteHomeImages } from "../lib/supabase/storage-server";
import {
  deleteKindeUser,
  kindeManagementEnabled,
} from "../lib/kinde-management";
import type { ActionResult } from "../lib/action-result";

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
