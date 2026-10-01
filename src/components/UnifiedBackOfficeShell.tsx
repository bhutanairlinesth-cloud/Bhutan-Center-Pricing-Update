import React, { useMemo, useState } from 'react';
import {
  BarChart3, Building2, ClipboardList, CreditCard, FileText,
  Globe2, Hash, LayoutDashboard, LineChart, LogOut, Megaphone, Menu, PackageOpen,
  Radio, Receipt, Search, Settings2, Tags, Target, UserCircle2, Users, X,
} from 'lucide-react';
import { GlobalSettings, User } from '../types';
import { Brand } from './Brand';
import { Workspace } from '../routes';

interface Props {
  currentUser: User;
  settings: GlobalSettings;
  workspace: Workspace;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

type NavItem = {
  workspace: Workspace;
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const cleanPath = (value: string) => value.replace(/\/+$/, '') || '/admin';

const PATH_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/quotations': 'ใบเสนอราคา',
  '/admin/bookings': 'การจอง',
  '/admin/invoices': 'ใบแจ้งหนี้',
  '/admin/payments': 'รับชำระเงิน',
  '/admin/reports': 'รายงานยอดขาย',
  '/admin/packages': 'โปรแกรมทัวร์',
  '/admin/pricing-settings': 'ค่าตั๋ว/วีซ่า/FX',
  '/admin/agents': 'เอเจนต์',
  '/admin/company': 'บริษัท & ธนาคาร',
  '/admin/document-numbers': 'เลขที่เอกสาร',
  '/admin/users': 'ผู้ใช้งาน',
  '/admin/marketing': 'ภาพรวมการตลาด',
  '/admin/marketing/realtime': 'ผู้เข้าชมเรียลไทม์',
  '/admin/marketing/funnel': 'Funnel',
  '/admin/marketing/audience': 'Audience & Tags',
  '/admin/marketing/integrations': 'การเชื่อมต่อ',
  '/admin/marketing/meta': 'การเชื่อมต่อ',
  '/admin/marketing/google': 'การเชื่อมต่อ',
  '/admin/marketing/line': 'LINE OA',
  '/admin/marketing/website': 'เว็บไซต์',
  '/admin/marketing/seo': 'SEO',
};

function breadcrumbForPath(path: string) {
  const normalized = cleanPath(path);
  const segments = normalized.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'Admin', path: '/admin' }];
  let acc = '/admin';
  for (const seg of segments) {
    acc = `${acc}/${seg}`;
    crumbs.push({ label: PATH_LABELS[acc] || seg, path: acc });
  }
  return crumbs;
}

export function UnifiedBackOfficeShell({ currentUser, settings, workspace, currentPath, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sections: NavSection[] = useMemo(() => [
    {
      label: 'ภาพรวม',
      items: [
        { workspace: 'dashboard', path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'งานขาย',
      items: [
        { workspace: 'sales', path: '/admin/quotations', label: 'ใบเสนอราคา', icon: FileText },
        { workspace: 'sales', path: '/admin/bookings', label: 'การจอง', icon: ClipboardList },
        { workspace: 'sales', path: '/admin/invoices', label: 'ใบแจ้งหนี้', icon: Receipt },
        { workspace: 'sales', path: '/admin/payments', label: 'รับชำระเงิน', icon: CreditCard },
        { workspace: 'sales', path: '/admin/reports', label: 'รายงานยอดขาย', icon: BarChart3, adminOnly: true },
      ],
    },
    {
      label: 'ข้อมูลหลัก',
      items: [
        { workspace: 'master', path: '/admin/packages', label: 'โปรแกรมทัวร์', icon: PackageOpen, adminOnly: true },
        { workspace: 'master', path: '/admin/pricing-settings', label: 'ค่าตั๋ว/วีซ่า/FX', icon: Settings2, adminOnly: true },
        { workspace: 'master', path: '/admin/agents', label: 'เอเจนต์', icon: UserCircle2, adminOnly: true },
        { workspace: 'master', path: '/admin/company', label: 'บริษัท & ธนาคาร', icon: Building2, adminOnly: true },
        { workspace: 'master', path: '/admin/document-numbers', label: 'เลขที่เอกสาร', icon: Hash, adminOnly: true },
        { workspace: 'master', path: '/admin/users', label: 'ผู้ใช้งาน', icon: Users, adminOnly: true },
      ],
    },
    {
      label: 'การตลาด',
      items: [
        { workspace: 'marketing', path: '/admin/marketing', label: 'ภาพรวมการตลาด', icon: LineChart },
        { workspace: 'marketing', path: '/admin/marketing/realtime', label: 'ผู้เข้าชมเรียลไทม์', icon: Radio },
        { workspace: 'marketing', path: '/admin/marketing/funnel', label: 'Funnel', icon: Target },
        { workspace: 'marketing', path: '/admin/marketing/audience', label: 'Audience & Tags', icon: Tags },
        { workspace: 'marketing', path: '/admin/marketing/integrations', label: 'การเชื่อมต่อ', icon: Settings2, adminOnly: true },
        { workspace: 'marketing', path: '/admin/marketing/line', label: 'LINE OA', icon: Megaphone },
        { workspace: 'marketing', path: '/admin/marketing/website', label: 'เว็บไซต์', icon: Globe2 },
        { workspace: 'marketing', path: '/admin/marketing/seo', label: 'SEO', icon: Search },
      ],
    },
  ], []);

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || currentUser.role === 'admin'),
    }))
    .filter((section) => section.items.length > 0);

  const visibleItems = visibleSections.flatMap((section) => section.items);
  const normalizedPath = cleanPath(currentPath);
  const activePath = visibleItems
    .filter((item) => item.path === '/admin'
      ? normalizedPath === '/admin'
      : normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  const activeItem = visibleItems.find((item) => item.path === activePath)
    || visibleItems.find((item) => item.workspace === workspace)
    || visibleItems[0];

  const crumbs = breadcrumbForPath(normalizedPath);

  function handleNavigate(item: NavItem) {
    onNavigate(item.path);
    setOpen(false);
  }

  return (
    <div className={`unified-backoffice-shell unified-backoffice-shell--single-nav bo-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`unified-sidebar unified-sidebar--flat bo-sidebar ${open ? 'open' : ''}`}>
        <div className="unified-sidebar-brand">
          <Brand light logoUrl={settings.logoUrl} />
          <button className="unified-sidebar-close" onClick={() => setOpen(false)} aria-label="ปิดเมนู"><X /></button>
        </div>

        <div className="unified-sidebar-caption unified-sidebar-caption--compact">
          <span>BHUTAN CENTER</span>
          <strong>Back Office</strong>
        </div>

        <nav className="unified-sidebar-nav unified-sidebar-nav--flat">
          {visibleSections.map((section) => (
            <section className="unified-flat-section" key={section.label}>
              <div className="unified-flat-section-title bo-nav-group">{section.label}</div>
              <div className="unified-flat-section-items bo-nav-items">
                {section.items.map((item) => {
                  const active = item.path === activePath;
                  const Icon = item.icon;
                  return (
                    <button key={item.path} className={active ? 'active' : ''} onClick={() => handleNavigate(item)} title={item.label}>
                      <i><Icon /></i>
                      <span><strong>{item.label}</strong></span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="unified-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer"><Globe2 /><span>เปิดเว็บไซต์</span></a>
          <div className="unified-sidebar-user">
            <i>{currentUser.name?.[0]?.toUpperCase() || 'U'}</i>
            <span><strong>{currentUser.name}</strong></span>
            <button onClick={onLogout} title="ออกจากระบบ"><LogOut /></button>
          </div>
        </div>
      </aside>

      {open && <button className="unified-sidebar-overlay" onClick={() => setOpen(false)} aria-label="ปิดเมนู" />}

      <section className="unified-workspace bo-workspace">
        <header className="bo-topbar">
          <div className="bo-topbar-actions">
            <button type="button" className="bo-sidebar-toggle" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'เปิดเมนู' : 'ปิดเมนู'}>
              <Menu size={16} />
            </button>
            <button type="button" className="menu-button unified-mobile-only" onClick={() => setOpen((v) => !v)} aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}><Menu /></button>
            <div className="bo-topbar-breadcrumb">
              {crumbs.map((c, i) => (
                <React.Fragment key={c.path}>
                  {i > 0 && ' / '}
                  {i < crumbs.length - 1 ? (
                    <button type="button" className="bo-breadcrumb-link" onClick={() => onNavigate(c.path)}>{c.label}</button>
                  ) : (
                    <strong>{c.label}</strong>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <span className="bo-topbar-user">{currentUser.name?.[0]?.toUpperCase() || 'U'}</span>
        </header>
        <header className="unified-mobile-topbar">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}><Menu /></button>
          <div><small>BACK OFFICE</small><strong>{activeItem?.label || 'Dashboard'}</strong></div>
          <span>{currentUser.name?.[0]?.toUpperCase() || 'U'}</span>
        </header>
        <div className="unified-workspace-content bo-workspace-content">{children}</div>
      </section>
    </div>
  );
}
