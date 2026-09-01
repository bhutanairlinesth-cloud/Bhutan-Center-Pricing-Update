import React, { useState } from 'react';
import {
  Calculator, ChevronRight, ClipboardList, Globe2, LayoutDashboard, LogOut,
  Megaphone, Menu, Settings2, X,
} from 'lucide-react';
import { GlobalSettings, User } from '../types';
import { Brand } from './Brand';

export type Workspace = 'dashboard' | 'front' | 'tracking' | 'growth' | 'admin';

interface Props {
  currentUser: User;
  settings: GlobalSettings;
  workspace: Workspace;
  onNavigate: (workspace: Workspace) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const labels: Record<Workspace, { title: string; eyebrow: string }> = {
  dashboard: { title: 'ภาพรวม', eyebrow: 'OVERVIEW' },
  front: { title: 'คำนวณราคา', eyebrow: 'PRICING DESK' },
  tracking: { title: 'ติดตามลูกค้า', eyebrow: 'CRM / SALES' },
  growth: { title: 'เว็บไซต์ & การตลาด', eyebrow: 'WEBSITE / LINE' },
  admin: { title: 'ตั้งค่าระบบ', eyebrow: 'SYSTEM SETTINGS' },
};

export function UnifiedBackOfficeShell({ currentUser, settings, workspace, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);

  const nav = [
    { id: 'dashboard' as const, label: 'ภาพรวม', detail: 'Dashboard', icon: LayoutDashboard, group: 'หลัก' },
    { id: 'front' as const, label: 'คำนวณราคา', detail: 'Pricing Desk', icon: Calculator, group: 'การขาย' },
    { id: 'tracking' as const, label: 'ติดตามลูกค้า', detail: 'CRM / Invoice / Payment', icon: ClipboardList, group: 'การขาย' },
    { id: 'growth' as const, label: 'เว็บไซต์ & การตลาด', detail: 'LINE / Funnel / SEO', icon: Megaphone, group: 'การตลาด' },
    ...(currentUser.role === 'admin'
      ? [{ id: 'admin' as const, label: 'ตั้งค่าระบบ', detail: 'Program / Hotel / User', icon: Settings2, group: 'ระบบ' }]
      : []),
  ];

  let lastGroup = '';

  return <div className="unified-backoffice-shell">
    <aside className={`unified-sidebar ${open ? 'open' : ''}`}>
      <div className="unified-sidebar-brand">
        <Brand light logoUrl={settings.logoUrl}/>
        <button className="unified-sidebar-close" onClick={() => setOpen(false)} aria-label="ปิดเมนู"><X/></button>
      </div>

      <div className="unified-sidebar-caption">
        <span>BHUTAN CENTER</span>
        <strong>Back Office</strong>
        <small>Pricing · CRM · Website · LINE</small>
      </div>

      <nav className="unified-sidebar-nav">
        {nav.map((item) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          return <React.Fragment key={item.id}>
            {showGroup && <div className="unified-nav-group">{item.group}</div>}
            <button className={workspace === item.id ? 'active' : ''} onClick={() => { onNavigate(item.id); setOpen(false); }}>
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
        <div><small>{labels[workspace].eyebrow}</small><strong>{labels[workspace].title}</strong></div>
        <span>{currentUser.name?.[0]?.toUpperCase() || 'U'}</span>
      </header>
      <div className="unified-workspace-content">{children}</div>
    </section>
  </div>;
}
