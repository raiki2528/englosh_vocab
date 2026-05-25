import { createClient } from "@supabase/supabase-js";

function resolveSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = raw.match(/https?:\/\/[^\s\])]+/);
  return (match ? match[0] : raw).replace(/\/$/, "");
}

export function createSupabaseServerClient() {
  const url = resolveSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。",
    );
  }

  return createClient(url, anonKey);
}
