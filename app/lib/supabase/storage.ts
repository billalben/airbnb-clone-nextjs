import { createClient } from "../supabase/server";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

export async function getImageUrls(paths: (string | null | undefined)[]) {
  if (paths.length === 0) return [];
  const supabase = await createClient();
  return paths.map((path) =>
    path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null,
  );
}
