import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    throw new Error("Something went wrong, i am sorry....");
  }

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      firstName: user.given_name ?? "",
      lastName: user.family_name ?? "",
      profileImage:
        user.picture ?? `https://avatar.vercel.sh/${user.given_name}`,
    },
    update: {},
  });

  const base = process.env.KINDE_SITE_URL ?? new URL("/", request.url).origin;
  return NextResponse.redirect(new URL("/", base));
}
