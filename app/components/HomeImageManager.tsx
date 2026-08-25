"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import {
  addHomeImage,
  deleteHomeImage,
  setPrimaryImage,
} from "../actions";

type ImageItem = {
  id: string;
  path: string;
  url: string;
  isPrimary: boolean;
};

export function HomeImageManager({
  homeId,
  images,
}: {
  homeId: string;
  images: ImageItem[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Images</h3>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No images yet. Add one below.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <Image
                src={img.url}
                alt="Home image"
                fill
                className="object-cover"
              />
              {img.isPrimary && (
                <div className="absolute top-2 left-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Primary
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {!img.isPrimary && (
                  <form action={setPrimaryImage}>
                    <input type="hidden" name="homeId" value={homeId} />
                    <input type="hidden" name="imageId" value={img.id} />
                    <Button
                      size="icon-xs"
                      variant="secondary"
                      type="submit"
                      title="Set as primary"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  </form>
                )}
                <form action={deleteHomeImage}>
                  <input type="hidden" name="homeId" value={homeId} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    type="submit"
                    title="Delete image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        action={async (fd) => {
          setAdding(true);
          try {
            await addHomeImage(fd);
          } finally {
            setAdding(false);
          }
        }}
        className="mt-6 space-y-2"
        encType="multipart/form-data"
      >
        <input type="hidden" name="homeId" value={homeId} />
        <Label>Add new image</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="flex-1"
          />
          <Button type="submit" disabled={adding}>
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1 h-4 w-4" />
            )}
            Upload
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or WEBP. Max 5MB. The first image is set as the primary
          automatically; you can change it with the star button.
        </p>
      </form>
    </Card>
  );
}
