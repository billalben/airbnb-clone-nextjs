"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "overview", href: "/admin", label: "Overview", exact: true },
  { value: "homes", href: "/admin/homes", label: "Homes" },
  { value: "users", href: "/admin/users", label: "Users" },
  {
    value: "reservations",
    href: "/admin/reservations",
    label: "Reservations",
  },
];

function valueFromPath(pathname: string): string {
  const match = tabs.find(
    (t) =>
      (t.exact && pathname === t.href) ||
      (!t.exact && (pathname === t.href || pathname.startsWith(`${t.href}/`))),
  );
  return match?.value ?? tabs[0].value;
}

export function AdminTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const value = valueFromPath(pathname);

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const target = tabs.find((t) => t.value === next);
        if (target) router.push(target.href);
      }}
      className="mb-8"
    >
      <TabsList variant="line" className="w-full justify-start">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
