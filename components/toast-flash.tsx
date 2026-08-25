"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const TOAST_MESSAGES: Record<string, string> = {
  home_created: "Home created",
  home_updated: "Changes saved",
  home_deleted: "Home deleted",
  reservation_created: "Reservation confirmed",
};

export function ToastFlash() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key || fired.current) return;
    const message = TOAST_MESSAGES[key];
    if (!message) return;

    fired.current = true;
    toast.success(message);

    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
