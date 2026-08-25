import { createClient } from "@supabase/supabase-js";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return EXTENSION_BY_MIME[file.type] ?? "jpg";
}

function getBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "airbnb-images";
}

export function createStorageClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function uploadHomeImage(
  homeId: string,
  file: File,
): Promise<{ path: string }> {
  const supabase = createStorageClient();
  const bucket = getBucket();
  const filePath = `homes/${homeId}/${crypto.randomUUID()}.${getFileExtension(file)}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "216000", // 1 month
      contentType: file.type,
      upsert: true,
    });

  if (error || !data) {
    throw new Error(error?.message ?? "Image upload failed.");
  }

  return { path: data.path };
}

export async function deleteHomeImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createStorageClient();
  const bucket = getBucket();

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}
