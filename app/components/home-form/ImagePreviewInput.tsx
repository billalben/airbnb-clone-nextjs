"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES } from "@/app/lib/home-schema";
import { cn } from "@/lib/utils";

export function ImagePreviewInput({
  value,
  onChange,
  inputId,
  size = "compact",
}: {
  value?: File;
  onChange: (next?: File) => void;
  inputId: string;
  size?: "compact" | "large";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayUrl = previewUrl;

  if (size === "large") {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full max-w-2xl cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            displayUrl ? "border-solid border-border" : "h-72",
          )}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Selected image preview"
              width={672}
              height={288}
              unoptimized
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-16">
              <ImagePlus className="h-10 w-10" />
              <span className="text-sm font-medium">
                Click to choose an image
              </span>
            </div>
          )}
        </button>
        <div className="flex w-full max-w-2xl items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {value ? value.name : "No image selected"}
          </span>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            onChange(file);
          }}
          className="sr-only"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Selected image preview"
              width={128}
              height={128}
              unoptimized
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <ImagePlus className="h-8 w-8" />
          )}
        </button>
        <div className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="font-medium">
            {value ? value.name : "No image selected"}
          </span>
          <span className="text-muted-foreground">
            JPEG, PNG, or WEBP. Up to 5MB.
          </span>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-destructive hover:underline"
            >
              <X className="h-3 w-3" />
              Remove image
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          onChange(file);
        }}
        className="sr-only"
      />
    </div>
  );
}