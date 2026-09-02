import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Calculator, ChevronDown, ChevronRight, ClipboardList, Database, Globe2, Hotel,
  LayoutDashboard, LineChart, LogOut, Megaphone, Menu, PackageOpen, Radio, Search,
  Settings2, Tags, Target, Users, X,
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
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  detail: string;
  icon: React.ComponentType<any>;
  items: NavItem[];
};

const cleanPath = (value: string) => value.replace(/\/+$/, '') || '/admin';

export function UnifiedBackOfficeShell({ currentUser, settings, workspace, currentPath, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['sales', 'marketing']);

  const dashboardItem: NavItem = useMemo(() => ({
    workspace: 'dashboard',
    path: '/admin',
    label: 'ภาพรวมระบบ',
    detail: 'Dashboard Overview',
    icon: LayoutDashboard,
  }), []);

  const navGroups: NavGroup[] = useMemo(() => {
    const groups: NavGroup[] = [
      {
        id: 'sales',
        label: 'ฝ่ายขาย',
        detail: 'Pricing · CRM · Sales',
        icon: Calculator,
        items: [
          { workspace: 'front', path: '/admin/pricing', label: 'คำนวณราคา', detail: 'Pricing Desk', icon: Calculator },
          { workspace: 'tracking', path: '/admin/customers', label: 'ติดตามลูกค้า', detail: 'CRM · Invoice · Payment', icon: ClipboardList },
          { workspace: 'admin', path: '/admin/settings', label: 'รายงานยอดขาย', detail: 'Sales · Cost · Profit', icon: BarChart3, adminOnly: true },
        ],
      },
      {
        id: 'marketing',
        label: 'การตลาด',
        detail: 'Visitors · Funnel · Audience',
        icon: LineChart,
        items: [
          { workspace: 'growth', path: '/admin/marketing', label: 'ภาพรวมการตลาด', detail: 'Visitors · LINE · Sales', icon: LineChart },
          { workspace: 'growth', path: '/admin/marketing/realtime', label: 'ผู้เข้าชมเรียลไทม์', detail: 'Online Now · Live Pages', icon: Radio },
          { workspace: 'growth', path: '/admin/marketing/funnel', label: 'Funnel & Retargeting', detail: 'Journey · Drop-off · Retarget', icon: Target },
          { workspace: 'growth', path: '/admin/marketing/audience', label: 'Audience & Tags', detail: 'Website · LINE · CRM', icon: Tags },
          { workspace: 'growth', path: '/admin/marketing/meta', label: 'Facebook Pixel', detail: 'Meta Pixel · CAPI · Events', icon: Target },
          { workspace: 'growth', path: '/admin/marketing/google', label: 'Google Analytics & Ads', detail: 'Google Tag · GA4 · Remarketing', icon: BarChart3 },
        ],
      },
      {
        id: 'channels',
        label: 'เว็บไซต์ & LINE',
        detail: 'Website · Broadcast · SEO',
        icon: Megaphone,
        items: [
          { workspace: 'growth', path: '/admin/marketing/line', label: 'LINE OA & Broadcast', detail: 'Contacts · Flex · CTA', icon: Megaphone },
          { workspace: 'growth', path: '/admin/marketing/website', label: 'เว็บไซต์', detail: 'Public · Price · Publish', icon: Globe2 },
          { workspace: 'growth', path: '/admin/marketing/seo', label: 'SEO', detail: 'Search · Migration', icon: Search },
        ],
      },
      {
        id: 'tour',
        label: 'ข้อมูลทัวร์',
        detail: 'Packages · Hotels · Pricing',
        icon: PackageOpen,
        items: [
          { workspace: 'admin', path: '/admin/settings/packages', label: 'โปรแกรมทัวร์', detail: 'Tour Programs', icon: PackageOpen, adminOnly: true },
          { workspace: 'admin', path: '/admin/settings/hotels', label: 'โรงแรม', detail: 'Hotels', icon: Hotel, adminOnly: true },
          { workspace: 'admin', path: '/admin/settings/pricing', label: 'ราคาและค่าบริการ', detail: 'Flight · Visa · Margin', icon: Settings2, adminOnly: true },
        ],
      },
      {
        id: 'system',
        label: 'ระบบ',
        detail: 'Data · Users',
        icon: Database,
        items: [
          { workspace: 'admin', path: '/admin/settings/data', label: 'ข้อมูลระบบ', detail: 'Pricing Data Overview', icon: Database, adminOnly: true },
          { workspace: 'admin', path: '/admin/settings/users', label: 'ผู้ใช้งาน', detail: 'Team Access', icon: Users, adminOnly: true },
        ],
      },
    ];
    return groups;
  }, []);

  const visibleGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.adminOnly || currentUser.role === 'admin') }))
    .filter((group) => group.items.length > 0);

  const normalizedPath = cleanPath(currentPath);
  const visibleItems = [dashboardItem, ...visibleGroups.flatMap((group) => group.items)];
  const activePath = visibleItems
    .filter((item) => item.path === '/admin'
      ? normalizedPath === '/admin'
      : normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const activeItem = visibleItems.find((item) => item.path === activePath)
    || visibleItems.find((item) => item.workspace === workspace)
    || visibleItems[0];

  const activeGroupId = visibleGroups.find((group) => group.items.some((item) => item.path === activePath))?.id || null;

  useEffect(() => {
    if (!activeGroupId) return;
    setExpandedGroups((prev) => prev.includes(activeGroupId) ? prev : [...prev, activeGroupId]);
  }, [activeGroupId]);

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]);
  }

  function handleNavigate(item: NavItem) {
    onNavigate(item.workspace, item.path);
    setOpen(false);
  }

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

      <nav className="unified-sidebar-nav unified-sidebar-nav--organized unified-sidebar-nav--accordion">
        <button className={`unified-sidebar-dashboard ${activePath === '/admin' ? 'active' : ''}`} onClick={() => handleNavigate(dashboardItem)}>
          <i><LayoutDashboard/></i>
          <span><strong>{dashboardItem.label}</strong><small>{dashboardItem.detail}</small></span>
          <ChevronRight/>
        </button>

        {visibleGroups.map((group) => {
          const expanded = expandedGroups.includes(group.id);
          const groupActive = group.items.some((item) => item.path === activePath);
          const GroupIcon = group.icon;
          return <section key={group.id} className={`unified-nav-accordion ${expanded ? 'expanded' : ''} ${groupActive ? 'group-active' : ''}`}>
            <button className="unified-nav-accordion-head" onClick={() => toggleGroup(group.id)} aria-expanded={expanded}>
              <span className="unified-nav-accordion-title"><i><GroupIcon/></i><span><strong>{group.label}</strong><small>{group.detail}</small></span></span>
              <ChevronDown className="unified-nav-accordion-arrow"/>
            </button>
            {expanded && <div className="unified-nav-accordion-body">
              {group.items.map((item) => {
                const active = item.path === activePath;
                return <button key={item.path} className={active ? 'active' : ''} onClick={() => handleNavigate(item)}>
                  <i><item.icon/></i>
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <ChevronRight/>
                </button>;
              })}
            </div>}
          </section>;
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
