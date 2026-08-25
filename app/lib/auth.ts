import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./db";

export type KindeUser = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getKindeServerSession>["getUser"]>>
>;

export type DbUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

export async function getKindeUser(): Promise<KindeUser | null> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return user ?? null;
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const kindeUser = await getKindeUser();
  if (!kindeUser?.id) return null;
  return prisma.user.findUnique({ where: { id: kindeUser.id } });
}

export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}

export async function requireAdmin(): Promise<DbUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export type EditableHome = Awaited<ReturnType<typeof canEditHome>>;

// Owner-only: even admins should not edit a home's details from the UI.
// Admins can still delete via canDeleteHome.
export async function canEditHome(homeId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, userId: true },
  });
  if (!home) return null;

  const isOwner = home.userId === user.id;
  if (!isOwner) return null;

  return { home, user };
}

export async function canDeleteHome(homeId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, userId: true },
  });
  if (!home) return null;

  const isOwner = home.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) return null;

  return { home, user, isAdmin };
}
