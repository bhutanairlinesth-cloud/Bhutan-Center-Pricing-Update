import { defaultSeoState, type SeoState } from "./seo-config";

const ROW_ID = "default";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export async function loadSeoState(): Promise<SeoState> {
  const config = supabaseConfig();
  if (!config) return defaultSeoState;
  try {
    const response = await fetch(`${config.url}/rest/v1/website_seo_state?id=eq.${ROW_ID}&select=payload`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return defaultSeoState;
    const rows = await response.json();
    return rows?.[0]?.payload ? (rows[0].payload as SeoState) : defaultSeoState;
  } catch {
    return defaultSeoState;
  }
}

export async function saveSeoState(state: SeoState) {
  const config = supabaseConfig();
  if (!config) return { persisted: false, reason: "Supabase is not configured." };

  const response = await fetch(`${config.url}/rest/v1/website_seo_state?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: ROW_ID, payload: state, updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`SEO state save failed: ${response.status}`);
  return { persisted: true };
}
