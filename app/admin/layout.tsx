import Link from "next/link";
import { requireAdmin } from "../lib/auth";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/homes", label: "Homes" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reservations", label: "Reservations" },
];

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
      <nav className="mb-8 flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
