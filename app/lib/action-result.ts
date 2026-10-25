export type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };
