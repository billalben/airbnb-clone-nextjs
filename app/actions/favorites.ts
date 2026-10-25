"use server";

import { revalidatePath } from "next/cache";
import prisma from "../lib/db";
import { requireUser } from "../lib/auth";
import type { ActionResult } from "../lib/action-result";

function isPrismaConflict(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("code" in err)) return false;
  const code = (err as { code?: string }).code;
  // P2002: a concurrent request already created the favorite.
  // P2025: a concurrent request already removed it.
  return code === "P2002" || code === "P2025";
}

export async function toggleFavorite(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const homeId = formData.get("homeId")?.toString() ?? "";
  const pathName = formData.get("pathName")?.toString() ?? "";

  if (!homeId || !pathName) {
    return { ok: false, message: "Could not update favorites." };
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_homeId: { userId: user.id, homeId } },
    select: { id: true },
  });

  try {
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, homeId } });
    }
  } catch (err) {
    if (!isPrismaConflict(err)) {
      console.error("[toggleFavorite] failed:", err);
      return { ok: false, message: "Could not update favorites." };
    }
  }

  revalidatePath(pathName);
  return { ok: true };
}
