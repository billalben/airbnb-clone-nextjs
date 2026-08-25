import { requireAdmin } from "../lib/auth";
import { AdminTabs } from "./AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="container mx-auto mt-10 px-5 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
