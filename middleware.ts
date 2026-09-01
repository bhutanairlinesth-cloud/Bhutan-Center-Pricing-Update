import { NextRequest, NextResponse } from "next/server";
import { defaultSeoState, type SeoState } from "@/lib/seo-config";

async function getSeoState(): Promise<SeoState> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return defaultSeoState;

  try {
    const response = await fetch(
      `${url}/rest/v1/website_seo_state?id=eq.default&select=payload`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return defaultSeoState;
    const rows = await response.json();
    return rows?.[0]?.payload
      ? (rows[0].payload as SeoState)
      : defaultSeoState;
  } catch {
    return defaultSeoState;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const state = await getSeoState();

  const rule = state.redirects.find(
    (item) => item.enabled && item.from === pathname && item.to
  );

  if (!rule) return NextResponse.next();

  const destination = new URL(rule.to, request.url);
  return NextResponse.redirect(destination, rule.type);
}

export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
