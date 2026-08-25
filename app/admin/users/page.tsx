import { requireAdmin, getCurrentUser } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { AdminDeleteUserButton } from "@/app/components/admin/AdminDeleteUserButton";
import { unstable_noStore as noStore } from "next/cache";

export default async function AdminUsers() {
  await requireAdmin();
  noStore();
  const currentUser = await getCurrentUser();

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: {
      _count: {
        select: { Home: true, Reservation: true, Favorite: true },
      },
    },
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Homes</th>
            <th className="px-3 py-2 font-medium">Reservations</th>
            <th className="px-3 py-2 font-medium">Favorites</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                No users yet.
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="border-b">
                  <td className="px-3 py-2">
                    {u.firstName} {u.lastName}
                    {isSelf && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        u.role === "ADMIN"
                          ? "rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">{u._count.Home}</td>
                  <td className="px-3 py-2">{u._count.Reservation}</td>
                  <td className="px-3 py-2">{u._count.Favorite}</td>
                  <td className="px-3 py-2">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <AdminDeleteUserButton userId={u.id} email={u.email} />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
