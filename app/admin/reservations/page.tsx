import { requireAdmin } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { AdminDeleteReservationButton } from "@/app/components/admin/AdminDeleteReservationButton";
import { unstable_noStore as noStore } from "next/cache";
import { dateRangeLabel } from "@/app/lib/format";

export default async function AdminReservations() {
  await requireAdmin();
  noStore();

  const reservations = await prisma.reservation.findMany({
    orderBy: { startDate: "desc" },
    include: {
      User: { select: { firstName: true, lastName: true, email: true } },
      Home: { select: { id: true, title: true, country: true } },
    },
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Home</th>
            <th className="px-3 py-2 font-medium">Guest</th>
            <th className="px-3 py-2 font-medium">Dates</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                No reservations yet.
              </td>
            </tr>
          ) : (
            reservations.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.Home?.title ?? "(deleted)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.Home?.country ?? "—"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {r.User
                    ? `${r.User.firstName} ${r.User.lastName}`
                    : "—"}
                  {r.User?.email && (
                    <div className="text-xs text-muted-foreground">
                      {r.User.email}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {dateRangeLabel(r.startDate, r.endDate)}
                </td>
                <td className="px-3 py-2">
                  {r.createdAt.toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <AdminDeleteReservationButton reservationId={r.id} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
