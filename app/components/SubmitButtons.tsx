"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Star, Save, type LucideIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

export function CreationSubmit({
  label = "Next",
  icon: Icon,
  size = "lg",
}: {
  label?: string;
  icon?: LucideIcon;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled size={size}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please Wait
        </Button>
      ) : (
        <Button type="submit" size={size}>
          {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
          {label}
        </Button>
      )}
    </>
  );
}

export function ReservationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <Button className="w-full" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
        </Button>
      ) : (
        <Button className="w-full" type="submit">
          Make a Reservation!
        </Button>
      )}
    </>
  );
}

export function UpdateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled size="lg">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </Button>
      ) : (
        <Button type="submit" size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      )}
    </>
  );
}

export function DeleteSubmitButton({
  label = "Delete",
  size = "sm",
}: {
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button variant="destructive" size={size} disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <Button variant="destructive" size={size} type="submit">
          <Trash2 className="mr-1 h-4 w-4" />
          {label}
        </Button>
      )}
    </>
  );
}

export function IconDeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button variant="destructive" size="icon" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <Button variant="destructive" size="icon" type="submit">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}

export function SetPrimarySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button variant="secondary" size="icon" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <Button variant="secondary" size="icon" type="submit">
          <Star className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
