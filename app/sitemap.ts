import type { MetadataRoute } from "next";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = process.env.KINDE_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homes = await prisma.home.findMany({
    where: {
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
    },
    select: { id: true, createdAT: true },
    orderBy: { createdAT: "desc" },
    take: 1000,
  });

  return [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...homes.map((home) => ({
      url: new URL(`/home/${home.id}`, siteUrl).toString(),
      lastModified: home.createdAT,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
