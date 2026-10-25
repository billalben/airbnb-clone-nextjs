"use server";

import { redirect } from "next/navigation";
import prisma from "../lib/db";
import { requireUser } from "../lib/auth";
import { reservationSchema } from "../lib/home-schema";

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
