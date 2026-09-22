import { NextRequest, NextResponse } from 'next/server';

type RedirectRule = {
  enabled?: boolean;
  from?: string;
  to?: string;
  type?: 301 | 308 | number;
};

async function loadRedirects(): Promise<RedirectRule[]> {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!supabaseUrl || !serviceRoleKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/website_seo_state?id=eq.default&select=payload`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: 'no-store',
      },
    );
    if (!response.ok) return [];
    const rows = await response.json();
    const redirects = rows?.[0]?.payload?.redirects;
    return Array.isArray(redirects) ? redirects : [];
  } catch {
    return [];
  }
}

export default async function middleware(request: NextRequest) {
  const redirects = await loadRedirects();
  const rule = redirects.find(
    (item: RedirectRule) =>
      item?.enabled &&
      item.from === request.nextUrl.pathname &&
      typeof item.to === 'string' &&
      item.to.trim().length > 0,
  );

  if (!rule?.to) return NextResponse.next();

  const destination = new URL(rule.to, request.url);
  const status = rule.type === 301 ? 301 : 308;
  return NextResponse.redirect(destination, status);
}

export const config = {
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
