import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ToastFlash } from "@/components/toast-flash";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.KINDE_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Airbnb Clone",
    template: "%s | Airbnb Clone",
  },
  description: "Find and book unique homes and experiences around the world.",
  openGraph: {
    type: "website",
    siteName: "Airbnb Clone",
    title: "Airbnb Clone",
    description: "Find and book unique homes and experiences around the world.",
    images: ["/airbnb-desktop.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airbnb Clone",
    description: "Find and book unique homes and experiences around the world.",
    images: ["/airbnb-desktop.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} flex min-h-screen flex-col font-sans`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toaster />
          <Suspense>
            <ToastFlash />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
