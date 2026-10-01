export type Workspace = 'dashboard' | 'sales' | 'master' | 'marketing' | 'legacy';

export type RouteModule =
  | 'dashboard'
  | 'quotations'
  | 'bookings'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'packages'
  | 'pricing-settings'
  | 'agents'
  | 'company'
  | 'document-numbers'
  | 'users'
  | 'marketing';

export interface ParsedRoute {
  workspace: Workspace;
  module: RouteModule;
  id?: string;
  /** e.g. `edit` for `/admin/quotations/:id/edit` */
  action?: string;
  marketingTab?: string;
}

const LEGACY_REDIRECTS: Record<string, string> = {
  '/admin/pricing': '/admin/quotations/new',
  '/admin/customers': '/admin/bookings',
  '/admin/settings': '/admin/reports',
  '/admin/settings/pricing': '/admin/pricing-settings',
  '/admin/settings/packages': '/admin/packages',
  '/admin/settings/company': '/admin/company',
  '/admin/settings/users': '/admin/users',
  '/admin/settings/data': '/admin/pricing-settings',
  '/admin/settings/hotels': '/admin/packages',
};

export function resolveLegacyRedirect(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  return LEGACY_REDIRECTS[path] ?? null;
}

export function parseRoute(pathname: string): ParsedRoute {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  const redirect = resolveLegacyRedirect(path);
  if (redirect) return parseRoute(redirect);

  if (path === '/admin' || path === '/admin/') {
    return { workspace: 'dashboard', module: 'dashboard' };
  }

  const parts = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const [segment, id, action] = parts;

  const masterModules = new Set(['packages', 'pricing-settings', 'agents', 'company', 'document-numbers', 'users']);
  const salesModules = new Set(['quotations', 'bookings', 'invoices', 'payments', 'reports']);

  if (segment === 'marketing') {
    return { workspace: 'marketing', module: 'marketing', marketingTab: parts[1] || 'overview' };
  }
  if (masterModules.has(segment)) {
    return { workspace: 'master', module: segment as RouteModule, id };
  }
  if (salesModules.has(segment)) {
    return { workspace: 'sales', module: segment as RouteModule, id, action };
  }

  return { workspace: 'dashboard', module: 'dashboard' };
}

export function buildPath(module: RouteModule, id?: string, action?: string): string {
  if (module === 'dashboard') return '/admin';
  if (module === 'marketing') return '/admin/marketing';
  if (module === 'reports') return '/admin/reports';
  const base = `/admin/${module}`;
  if (id && action) return `${base}/${id}/${action}`;
  return id ? `${base}/${id}` : base;
}

export function buildMarketingPath(tab: string): string {
  return tab === 'overview' ? '/admin/marketing' : `/admin/marketing/${tab}`;
}
