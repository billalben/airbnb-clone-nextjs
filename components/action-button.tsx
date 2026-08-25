"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export type ActionButtonProps = {
  action: (formData: FormData) => Promise<unknown>;
  successMessage?: string;
  errorMessage?: string;
  confirm?: string;
  className?: string;
  type?: "submit" | "button";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | "xs";
  children: React.ReactNode;
};

export function ActionButton({
  action,
  successMessage,
  errorMessage,
  confirm,
  className,
  type = "submit",
  variant = "default",
  size = "default",
  children,
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type={type}
      disabled={pending}
      data-variant={variant}
      data-size={size}
      onClick={(event) => {
        if (type !== "submit") return;
        event.preventDefault();
        const form = event.currentTarget.form;
        if (!form) return;
        if (confirm && !window.confirm(confirm)) return;

        const formData = new FormData(form);
        startTransition(async () => {
          try {
            await action(formData);
            if (successMessage) toast.success(successMessage);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Something went wrong.";
            toast.error(errorMessage ?? message);
          }
        });
      }}
      className={className}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
