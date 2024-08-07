import Image from "next/image";
import Link from "next/link";
import DesktopLogo from "@/public/airbnb-desktop.png";
import MobileLogo from "@/public/airbnb-mobile.webp";
import { UserNav } from "./UserNav";
import { SearchModalComponent } from "./SearchComponent";

export function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="container mx-auto flex items-center justify-between px-5 py-5 lg:px-10">
        <Link href="/">
          <Image
            src={DesktopLogo}
            alt="Desktop Logo"
            className="hidden w-32 lg:block"
          />

          <Image
            src={MobileLogo}
            alt="Mobile Logo"
            className="block w-12 lg:hidden"
          />
        </Link>

        <SearchModalComponent />

        <UserNav />
      </div>
    </nav>
  );
}
