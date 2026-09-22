type RedirectRule = {
  enabled?: boolean;
  from?: string;
  to?: string;
  type?: number | string;
};

type SeoState = {
  redirects?: RedirectRule[];
};

async function getSeoState(): Promise<SeoState> {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !serviceRoleKey) {
    return { redirects: [] };
  }

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

    if (!response.ok) {
      return { redirects: [] };
    }

    const rows = await response.json();
    const payload = rows?.[0]?.payload;

    if (!payload || typeof payload !== 'object') {
      return { redirects: [] };
    }

    return payload as SeoState;
  } catch {
    return { redirects: [] };
  }
}

export default async function middleware(request: Request) {
  const requestUrl = new URL(request.url);
  const state = await getSeoState();

  const rule = (state.redirects || []).find(
    (item: RedirectRule) =>
      item.enabled &&
      item.from === requestUrl.pathname &&
      typeof item.to === 'string' &&
      item.to.length > 0,
  );

  // Returning nothing lets Vercel continue to the normal Vite route.
  if (!rule?.to) return;

  const destination = new URL(rule.to, request.url);
  const requestedStatus = Number(rule.type);
  const redirectStatus = [301, 302, 303, 307, 308].includes(requestedStatus)
    ? requestedStatus
    : 308;

  return Response.redirect(destination, redirectStatus);
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!api|admin|assets|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
