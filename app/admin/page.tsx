import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";

async function getStats() {
  const [users, homes, reservations, favorites, completedHomes] =
    await Promise.all([
      prisma.user.count(),
      prisma.home.count(),
      prisma.reservation.count(),
      prisma.favorite.count(),
      prisma.home.count({
        where: {
          addedCategory: true,
          addedDescription: true,
          addedLocation: true,
        },
      }),
    ]);
  return { users, homes, reservations, favorites, completedHomes };
}

export default async function AdminOverview() {
  await requireAdmin();
  const stats = await getStats();

  const items = [
    { label: "Total users", value: stats.users },
    { label: "Total homes", value: stats.homes },
    { label: "Published homes", value: stats.completedHomes },
    { label: "Total reservations", value: stats.reservations },
    { label: "Total favorites", value: stats.favorites },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {it.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{it.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
