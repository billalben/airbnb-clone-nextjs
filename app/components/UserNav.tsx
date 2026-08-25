import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MenuIcon,
  ShieldCheck,
  Home,
  Building2,
  Heart,
  CalendarCheck,
  UserPlus,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import {
  RegisterLink,
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "../lib/auth";

function getFullName(
  user:
    | {
        given_name?: string | null;
        family_name?: string | null;
        name?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
) {
  const full = [user?.given_name, user?.family_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (full) return full;
  return user?.name ?? user?.email ?? "User";
}

export async function UserNav() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const dbUser = await getCurrentUser();
  const isAdmin = dbUser?.role === "ADMIN";
  const hasPicture = Boolean(user?.picture);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-x-3 rounded-full border px-2 py-2 transition-colors hover:bg-muted/20 hover:shadow-sm lg:px-4 lg:py-2">
        <MenuIcon className="h-5 w-5 lg:h-4 lg:w-4" />

        {hasPicture ? (
          <Image
            src={user!.picture!}
            alt="User Avatar"
            width={28}
            height={25}
            className="hidden rounded-full lg:block"
          />
        ) : (
          <div
            aria-hidden
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground lg:flex"
          >
            <User className="h-4 w-4" />
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        {user ? (
          <>
            <div className="px-2 py-1.5 select-none">
              <p className="text-sm leading-tight font-medium">
                {getFullName(user)}
              </p>
              {user.email && (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/create" className="flex w-full items-center gap-2">
                <Home className="h-4 w-4" />
                Airbnb your Home
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/my-homes" className="flex w-full items-center gap-2">
                <Building2 className="h-4 w-4" />
                My Listings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/favorites"
                className="flex w-full items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                My Favorites
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/reservations"
                className="flex w-full items-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" />
                My Reservations
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    href="/admin"
                    className="flex w-full items-center gap-2 font-medium"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutLink className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </LogoutLink>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem>
              <RegisterLink className="flex w-full items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Register
              </RegisterLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LoginLink className="flex w-full items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </LoginLink>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
