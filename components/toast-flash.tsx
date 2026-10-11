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

const ERROR_TOAST_MESSAGES: Record<string, string> = {
  reservation_invalid_dates: "Please pick a valid check-in and check-out range.",
  reservation_unavailable: "Those dates are already booked.",
  reservation_own_home: "You cannot book your own home.",
  reservation_error: "Could not create your reservation. Please try again.",
};

export function ToastFlash() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key || fired.current) return;
    const successMessage = TOAST_MESSAGES[key];
    const errorMessage = ERROR_TOAST_MESSAGES[key];
    if (!successMessage && !errorMessage) return;

    fired.current = true;
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success(successMessage);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
