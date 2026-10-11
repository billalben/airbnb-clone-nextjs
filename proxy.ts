import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import type { NextProxy } from "next/server";

// Next 16 renamed `middleware` to `proxy`. Kinde's `withAuth` performs the
// session check, refreshes tokens, and redirects unauthenticated requests to
// login (returning to the current page afterwards). Server-side guards
// (requireUser / requireAdmin) remain as the authoritative checks.
const authProxy = withAuth({
  isReturnToCurrentPage: true,
}) as unknown as NextProxy;

export default authProxy;

// Only guard the authenticated areas; public browsing and API routes are
// untouched so static assets and the Kinde auth endpoints keep working.
export const config = {
  matcher: [
    "/create",
    "/create/:path*",
    "/my-homes",
    "/my-homes/:path*",
    "/favorites",
    "/favorites/:path*",
    "/reservations",
    "/reservations/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
