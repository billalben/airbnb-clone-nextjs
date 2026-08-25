"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteHome } from "../actions";

export function DeleteHomeButton({
  homeId,
  variant = "outline",
  size = "sm",
  className,
}: {
  homeId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={variant}
            size={size}
            type="button"
            className={className}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this home?</DialogTitle>
          <DialogDescription>
            This will permanently remove the home, its images, favorites, and
            reservations. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <form
            action={async (fd) => {
              setPending(true);
              try {
                await deleteHome(fd);
                setOpen(false);
              } finally {
                setPending(false);
              }
            }}
          >
            <input type="hidden" name="homeId" value={homeId} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Delete home
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
