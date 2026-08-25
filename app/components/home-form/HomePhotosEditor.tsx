"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_HOME,
  MAX_NEW_IMAGES_PER_SAVE,
} from "@/app/lib/home-schema";

type InitialImage = {
  id: string;
  path: string;
  url: string;
  isPrimary: boolean;
};

type ExistingImageState = {
  kind: "existing";
  id: string;
  url: string;
  isDeleted: boolean;
};

type NewImageState = {
  kind: "new";
  tempId: string;
  file: File;
  previewUrl: string;
};

type ImageState = ExistingImageState | NewImageState;

type ActionResult = { ok: true } | { ok: false; message?: string };

export function HomePhotosEditor({
  homeId,
  initialImages,
  action,
}: {
  homeId: string;
  initialImages: InitialImage[];
  action: (payload: {
    newImageFiles: File[];
    deleteImageIds: string[];
    primaryImageKey: string | null;
  }) => Promise<ActionResult>;
}) {
  const [existing, setExisting] = useState<ExistingImageState[]>(() =>
    initialImages.map((img) => ({
      kind: "existing",
      id: img.id,
      url: img.url,
      isDeleted: false,
    })),
  );
  const [newImages, setNewImages] = useState<NewImageState[]>([]);
  const initialPrimaryId = useMemo(
    () => initialImages.find((img) => img.isPrimary)?.id ?? null,
    [initialImages],
  );
  const [primaryKey, setPrimaryKey] = useState<string | null>(
    initialPrimaryId,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = newImages.map((img) => img.previewUrl);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [newImages]);

  const visibleExisting = useMemo(
    () => existing.filter((img) => !img.isDeleted),
    [existing],
  );

  const totalVisible = visibleExisting.length + newImages.length;

  const effectivePrimaryKey =
    totalVisible === 1
      ? visibleExisting.length === 1
        ? visibleExisting[0].id
        : newImages[0].tempId
      : primaryKey;

  const isDirty = useMemo(() => {
    if (existing.some((img) => img.isDeleted)) return true;
    if (newImages.length > 0) return true;
    const initialPrimarySet = new Set(
      initialImages.filter((img) => img.isPrimary).map((img) => img.id),
    );
    if (primaryKey === null && initialPrimarySet.size > 0) return true;
    if (primaryKey && primaryKey.startsWith("new-")) return true;
    if (primaryKey && !primaryKey.startsWith("new-")) {
      const stillExists = existing.some(
        (img) => img.id === primaryKey && !img.isDeleted,
      );
      const wasPrimary = initialPrimarySet.has(primaryKey);
      if (stillExists && !wasPrimary) return true;
      if (!stillExists && primaryKey !== null) return true;
    }
    return false;
  }, [existing, newImages, primaryKey, initialImages]);

  const handleAddFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remainingSlots = Math.max(0, MAX_IMAGES_PER_HOME - totalVisible);
      if (remainingSlots === 0) {
        toast.error(`A home can have at most ${MAX_IMAGES_PER_HOME} photos.`);
        return;
      }
      const incoming: NewImageState[] = [];
      for (const file of Array.from(files)) {
        if (
          !ACCEPTED_IMAGE_TYPES.includes(file.type) ||
          file.size === 0 ||
          file.size > 5 * 1024 * 1024
        ) {
          continue;
        }
        incoming.push({
          kind: "new",
          tempId: `new-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      if (incoming.length === 0) return;
      const allowed = incoming.slice(
        0,
        Math.min(MAX_NEW_IMAGES_PER_SAVE, remainingSlots),
      );
      if (allowed.length === 0) return;
      setNewImages((prev) => {
        const next = [...prev, ...allowed];
        if (next.length > remainingSlots) {
          return next.slice(0, remainingSlots);
        }
        return next;
      });
      if (inputRef.current) inputRef.current.value = "";
    },
    [totalVisible],
  );

  const handleRemove = useCallback(
    (key: string) => {
      if (totalVisible <= 1) {
        toast.error("A home must have at least one photo.");
        return;
      }
      if (effectivePrimaryKey === key) {
        toast.error(
          "You cannot remove the primary photo. Set another photo as primary first.",
        );
        return;
      }
      if (key.startsWith("new-")) {
        setNewImages((prev) => {
          const target = prev.find((img) => img.tempId === key);
          if (target) URL.revokeObjectURL(target.previewUrl);
          return prev.filter((img) => img.tempId !== key);
        });
      } else {
        setExisting((prev) =>
          prev.map((img) =>
            img.id === key ? { ...img, isDeleted: true } : img,
          ),
        );
      }
    },
    [totalVisible, effectivePrimaryKey],
  );

  const handleReset = useCallback(() => {
    for (const img of newImages) URL.revokeObjectURL(img.previewUrl);
    setExisting(
      initialImages.map((img) => ({
        kind: "existing",
        id: img.id,
        url: img.url,
        isDeleted: false,
      })),
    );
    setNewImages([]);
    setPrimaryKey(initialPrimaryId);
    setError(null);
  }, [newImages, initialImages, initialPrimaryId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const newImageFiles = newImages.map((img) => img.file);
      const deleteImageIds = existing
        .filter((img) => img.isDeleted)
        .map((img) => img.id);
      let primaryImageKey = effectivePrimaryKey;
      if (effectivePrimaryKey && effectivePrimaryKey.startsWith("new-")) {
        const index = newImages.findIndex(
          (img) => img.tempId === effectivePrimaryKey,
        );
        primaryImageKey = index >= 0 ? `new-${index}` : null;
      }
      const result = await action({
        newImageFiles,
        deleteImageIds,
        primaryImageKey,
      });
      if (result.ok) {
        toast.success("Photos updated");
        for (const img of newImages) URL.revokeObjectURL(img.previewUrl);
        window.location.reload();
      } else {
        const message = result.message ?? "Failed to save changes.";
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const finalMessage = message || "Failed to save changes.";
      setError(finalMessage);
      toast.error(finalMessage);
    } finally {
      setIsSaving(false);
    }
  }, [newImages, existing, effectivePrimaryKey, action]);

  const newImageCount = newImages.length;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Photos</h3>
          <p className="text-sm text-muted-foreground">
            Add new photos, set a primary photo, or remove existing ones.
            Changes are saved when you click Save changes.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalVisible} photo{totalVisible === 1 ? "" : "s"}
        </div>
      </div>

      {totalVisible === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No photos yet. Use &quot;Add photos&quot; below to upload some.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {visibleExisting.map((img) => (
            <PhotoTile
              key={img.id}
              url={img.url}
              alt="Home photo"
              isPrimary={effectivePrimaryKey === img.id}
              canRemove={totalVisible > 1 && effectivePrimaryKey !== img.id}
              onSetPrimary={() => setPrimaryKey(img.id)}
              onRemove={() => handleRemove(img.id)}
            />
          ))}
          {newImages.map((img) => (
            <PhotoTile
              key={img.tempId}
              url={img.previewUrl}
              alt="New photo preview"
              isPrimary={effectivePrimaryKey === img.tempId}
              isNew
              canRemove={totalVisible > 1 && effectivePrimaryKey !== img.tempId}
              onSetPrimary={() => setPrimaryKey(img.tempId)}
              onRemove={() => handleRemove(img.tempId)}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
            totalVisible >= MAX_IMAGES_PER_HOME
              ? "pointer-events-none opacity-50"
              : "hover:border-primary hover:text-primary",
          )}
        >
          <ImagePlus className="h-4 w-4" />
          Add photos
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            disabled={totalVisible >= MAX_IMAGES_PER_HOME}
            onChange={(event) => handleAddFiles(event.target.files)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or WEBP. Up to 5MB each. A home can have at most{" "}
          {MAX_IMAGES_PER_HOME} photos.
          {newImageCount > 0 && (
            <>
              {" "}
              {newImageCount} ready to save.
            </>
          )}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSaving || !isDirty}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </Card>
  );
}

function PhotoTile({
  url,
  alt,
  isPrimary,
  isNew,
  canRemove,
  onSetPrimary,
  onRemove,
}: {
  url: string;
  alt: string;
  isPrimary: boolean;
  isNew?: boolean;
  canRemove: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
      />
      <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1">
        {isPrimary ? (
          <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Primary
          </span>
        ) : isNew ? (
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
            New
          </span>
        ) : (
          <span />
        )}
      </div>
      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
        {!isPrimary && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="inline-flex items-center gap-1 rounded bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-background"
          >
            <Star className="h-3 w-3" />
            Set primary
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove photo"
            className="ml-auto inline-flex items-center justify-center rounded bg-background/90 p-1.5 text-destructive shadow-sm hover:bg-background"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </li>
  );
}