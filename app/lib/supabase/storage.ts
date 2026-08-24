import { createClient } from "../supabase/server";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

export async function getImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
