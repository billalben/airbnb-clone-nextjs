import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Not Found</h2>
      <p className="text-slate-500">Could not find requested resource</p>
      <Button size="lg" asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
