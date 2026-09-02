import React, { useMemo, useState } from 'react';
import {
  BarChart3, Calculator, ChevronRight, ClipboardList, Database, Globe2, Hotel,
  LayoutDashboard, LineChart, LogOut, Megaphone, Menu, PackageOpen, Search,
  Radio, Settings2, Tags, Target, Users, X,
} from 'lucide-react';
import { GlobalSettings, User } from '../types';
import { Brand } from './Brand';

export type Workspace = 'dashboard' | 'front' | 'tracking' | 'growth' | 'admin';

interface Props {
  currentUser: User;
  settings: GlobalSettings;
  workspace: Workspace;
  currentPath: string;
  onNavigate: (workspace: Workspace, path?: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

type NavItem = {
  workspace: Workspace;
  path: string;
  label: string;
  detail: string;
  group: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
};

const cleanPath = (value: string) => value.replace(/\/+$/, '') || '/admin';

export function UnifiedBackOfficeShell({ currentUser, settings, workspace, currentPath, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = useMemo(() => [
    { workspace: 'dashboard', path: '/admin', label: 'ภาพรวม', detail: 'Back Office Overview', icon: LayoutDashboard, group: 'หลัก' },

    { workspace: 'front', path: '/admin/pricing', label: 'คำนวณราคา', detail: 'Pricing Desk', icon: Calculator, group: 'การขาย & CRM' },
    { workspace: 'tracking', path: '/admin/customers', label: 'ติดตามลูกค้า', detail: 'CRM · Invoice · Payment', icon: ClipboardList, group: 'การขาย & CRM' },

    { workspace: 'admin', path: '/admin/settings/packages', label: 'โปรแกรมทัวร์', detail: 'Tour Programs', icon: PackageOpen, group: 'ข้อมูลทัวร์', adminOnly: true },
    { workspace: 'admin', path: '/admin/settings/hotels', label: 'โรงแรม', detail: 'Hotels', icon: Hotel, group: 'ข้อมูลทัวร์', adminOnly: true },
    { workspace: 'admin', path: '/admin/settings/pricing', label: 'ราคาและค่าบริการ', detail: 'Flight · Visa · Margin', icon: Settings2, group: 'ข้อมูลทัวร์', adminOnly: true },

    { workspace: 'growth', path: '/admin/marketing', label: 'ภาพรวมการตลาด', detail: 'Visitors · LINE · Sales', icon: LineChart, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/realtime', label: 'ผู้เข้าชมเรียลไทม์', detail: 'Online Now · Live Pages', icon: Radio, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/audience', label: 'Audience & Tags', detail: 'Website · LINE · CRM', icon: Tags, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/funnel', label: 'Funnel & Retargeting', detail: 'Journey · Drop-off · Retarget', icon: Target, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/meta', label: 'Facebook Pixel', detail: 'Meta Pixel · CAPI · Events', icon: Target, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/google', label: 'Google Analytics & Ads', detail: 'Google Tag · GA4 · Remarketing', icon: BarChart3, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/website', label: 'เว็บไซต์', detail: 'Public · Price · Publish', icon: Globe2, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/line', label: 'LINE OA', detail: 'Contacts · Broadcast', icon: Megaphone, group: 'การตลาด' },
    { workspace: 'growth', path: '/admin/marketing/seo', label: 'SEO', detail: 'Search · Migration', icon: Search, group: 'การตลาด' },

    { workspace: 'admin', path: '/admin/settings', label: 'รายงานยอดขาย', detail: 'Sales · Cost · Profit', icon: BarChart3, group: 'รายงาน & ระบบ', adminOnly: true },
    { workspace: 'admin', path: '/admin/settings/data', label: 'ข้อมูลระบบ', detail: 'Pricing Data Overview', icon: Database, group: 'รายงาน & ระบบ', adminOnly: true },
    { workspace: 'admin', path: '/admin/settings/users', label: 'ผู้ใช้งาน', detail: 'Team Access', icon: Users, group: 'รายงาน & ระบบ', adminOnly: true },
  ], []);

  const visibleNav = nav.filter((item) => !item.adminOnly || currentUser.role === 'admin');
  const normalizedPath = cleanPath(currentPath);
  const activePath = visibleNav
    .filter((item) => item.path === '/admin'
      ? normalizedPath === '/admin'
      : normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const activeItem = visibleNav.find((item) => item.path === activePath)
    || visibleNav.find((item) => item.workspace === workspace)
    || visibleNav[0];

  let lastGroup = '';

  return <div className="unified-backoffice-shell unified-backoffice-shell--single-nav">
    <aside className={`unified-sidebar unified-sidebar--organized ${open ? 'open' : ''}`}>
      <div className="unified-sidebar-brand">
        <Brand light logoUrl={settings.logoUrl}/>
        <button className="unified-sidebar-close" onClick={() => setOpen(false)} aria-label="ปิดเมนู"><X/></button>
      </div>

      <div className="unified-sidebar-caption unified-sidebar-caption--compact">
        <span>BHUTAN CENTER</span>
        <strong>Back Office</strong>
        <small>Pricing · CRM · Website · LINE</small>
      </div>

      <nav className="unified-sidebar-nav unified-sidebar-nav--organized">
        {visibleNav.map((item) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          const active = item.path === activePath;
          return <React.Fragment key={item.path}>
            {showGroup && <div className="unified-nav-group">{item.group}</div>}
            <button className={active ? 'active' : ''} onClick={() => { onNavigate(item.workspace, item.path); setOpen(false); }}>
              <i><item.icon/></i>
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              <ChevronRight/>
            </button>
          </React.Fragment>;
        })}
      </nav>

      <div className="unified-sidebar-footer">
        <a href="/" target="_blank" rel="noreferrer"><Globe2/><span>เปิดเว็บไซต์</span><b>↗</b></a>
        <div className="unified-sidebar-user">
          <i>{currentUser.name?.[0]?.toUpperCase() || 'U'}</i>
          <span><strong>{currentUser.name}</strong><small>{currentUser.role === 'admin' ? 'Administrator' : 'Staff'}</small></span>
          <button onClick={onLogout} title="ออกจากระบบ"><LogOut/></button>
        </div>
      </div>
    </aside>

    {open && <button className="unified-sidebar-overlay" onClick={() => setOpen(false)} aria-label="ปิดเมนู"/>}

    <section className="unified-workspace">
      <header className="unified-mobile-topbar">
        <button onClick={() => setOpen(true)} aria-label="เปิดเมนู"><Menu/></button>
        <div><small>{activeItem?.detail || 'BACK OFFICE'}</small><strong>{activeItem?.label || 'ภาพรวม'}</strong></div>
        <span>{currentUser.name?.[0]?.toUpperCase() || 'U'}</span>
      </header>
      <div className="unified-workspace-content">{children}</div>
    </section>
  </div>;
}
