import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BadgePercent, Building2, ChevronRight, CircleDollarSign, Database,
  Gauge, Hotel as HotelIcon, LayoutDashboard, LogOut, Menu, PackageOpen, Pencil,
  Plane, Plus, RefreshCw, Save, Settings2, ShieldCheck, Trash2, Users, X,
} from 'lucide-react';
import { GlobalSettings, Hotel, HotelCategory, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { formatNumber, formatTHB, makeId } from '../utils/format';
import { Brand } from './Brand';
import { EmptyState, Modal } from './Ui';

type AdminPage = 'overview' | 'packages' | 'hotels' | 'settings' | 'users';

interface AdminProps {
  settings: GlobalSettings;
  hotels: Hotel[];
  packages: TourPackage[];
  users: User[];
  currentUser: User;
  mode: 'supabase' | 'local';
  onBack: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onSaveSettings: (settings: GlobalSettings) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string>;
  onResetLogo: () => Promise<void>;
  onSaveHotel: (hotel: Hotel) => Promise<void>;
  onDeleteHotel: (id: string) => Promise<void>;
  onSavePackage: (pkg: TourPackage) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export function Admin({ settings, hotels, packages, users, currentUser, mode, onBack, onLogout, onRefresh, onSaveSettings, onUploadLogo, onResetLogo, onSaveHotel, onDeleteHotel, onSavePackage, onDeletePackage, onSaveUser, onDeleteUser }: AdminProps) {
  const { t, language } = useI18n();
  const [page, setPage] = useState<AdminPage>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { id: 'overview' as const, label: t('adminOverview'), icon: LayoutDashboard },
    { id: 'packages' as const, label: t('packages'), icon: PackageOpen },
    { id: 'hotels' as const, label: t('hotels'), icon: HotelIcon },
    { id: 'settings' as const, label: t('pricingSettings'), icon: Settings2 },
    { id: 'users' as const, label: t('users'), icon: Users },
  ];
  const active = nav.find((item) => item.id === page) || nav[0];

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="admin-brand-row"><Brand light logoUrl={settings.logoUrl}/><button className="sidebar-close" onClick={() => setMenuOpen(false)}><X/></button></div>
      <div className="workspace-label"><span>{t('backOffice')}</span><small>{mode === 'supabase' ? t('online') : t('local')}</small></div>
      <nav className="admin-nav">{nav.map((item) => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setMenuOpen(false); }}><item.icon/><span>{item.label}</span><ChevronRight/></button>)}</nav>
      <div className="sidebar-footer"><button onClick={onBack}><ArrowLeft/>{t('backToCalculator')}</button><button onClick={onLogout}><LogOut/>{t('logout')}</button></div>
    </aside>
    {menuOpen && <button className="admin-overlay" onClick={() => setMenuOpen(false)}/>} 
    <main className="admin-main">
      <header className="admin-header">
        <div className="admin-header-title"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu/></button><div><span>BACK OFFICE</span><h1>{active.label}</h1></div></div>
        <div className="admin-header-actions"><LanguageSwitch compact/><button className="ghost-button" onClick={onRefresh}><RefreshCw/>{t('syncNow')}</button><span className="admin-user"><i>{currentUser.name?.[0]?.toUpperCase()}</i><b>{currentUser.name}</b></span></div>
      </header>
      <div className="admin-content">
        {page === 'overview' && <AdminOverview settings={settings} hotels={hotels} packages={packages} users={users} language={language} onOpen={setPage}/>} 
        {page === 'packages' && <PackagesManager items={packages} onSave={onSavePackage} onDelete={onDeletePackage}/>} 
        {page === 'hotels' && <HotelsManager items={hotels} onSave={onSaveHotel} onDelete={onDeleteHotel}/>} 
        {page === 'settings' && <SettingsManager initial={settings} onSave={onSaveSettings} onUploadLogo={onUploadLogo} onResetLogo={onResetLogo}/>} 
        {page === 'users' && <UsersManager items={users} currentUser={currentUser} onSave={onSaveUser} onDelete={onDeleteUser}/>} 
      </div>
    </main>
  </div>;
}

function AdminOverview({ settings, hotels, packages, users, language, onOpen }: { settings: GlobalSettings; hotels: Hotel[]; packages: TourPackage[]; users: User[]; language: 'th' | 'en'; onOpen: (page: AdminPage) => void }) {
  const { t } = useI18n();
  const cards = [
    { label: t('totalPackages'), value: packages.length.toString(), note: `${packages.reduce((sum, pkg) => sum + pkg.nights, 0)} total nights`, icon: PackageOpen, page: 'packages' as const },
    { label: t('totalHotels'), value: hotels.length.toString(), note: `${hotels.filter((h) => h.category === '5 Stars').length} luxury hotels`, icon: HotelIcon, page: 'hotels' as const },
    { label: t('currentUsd'), value: formatNumber(settings.exchangeRateUSD, 2), note: 'THB / USD', icon: Gauge, page: 'settings' as const },
    { label: t('systemUsers'), value: users.length.toString(), note: `${users.filter((u) => u.role === 'admin').length} admin`, icon: Users, page: 'users' as const },
  ];
  return <div className="admin-stack">
    <section className="admin-hero">
      <div><span className="eyebrow"><Database/> CENTRAL PRICING DATA</span><h2>{t('adminSubtitle')}</h2><p>Flight · Hotel · Package · Visa · Margin</p></div>
      <div className="admin-channel-cards"><div><span>RETAIL</span><strong>{formatTHB(settings.ticketPriceTHB, language)}</strong><small>Flight + {formatTHB(settings.marginTHB, language)} margin</small></div><div><span>AGENT</span><strong>{formatTHB(settings.agentTicketPriceTHB ?? 25220, language)}</strong><small>Flight + {formatTHB(settings.agentMarginTHB ?? 3000, language)} margin</small></div></div>
    </section>
    <section className="stats-grid">{cards.map((card) => <button key={card.label} className="stat-card" onClick={() => onOpen(card.page)}><span className="stat-icon"><card.icon/></span><span><small>{card.label}</small><strong>{card.value}</strong><em>{card.note}</em></span><ChevronRight/></button>)}</section>
    <section className="admin-two-column">
      <div className="panel-card"><div className="panel-heading"><div><span>{t('quickEdit')}</span><h3>Pricing controls</h3></div><button onClick={() => onOpen('settings')}>{t('edit')}<ChevronRight/></button></div><div className="pricing-control-list"><div><Plane/><span><b>{t('retailFlight')}</b><small>{formatTHB(settings.ticketPriceTHB, language)}</small></span></div><div><BadgePercent/><span><b>{t('agentFlight')}</b><small>{formatTHB(settings.agentTicketPriceTHB ?? 25220, language)}</small></span></div><div><CircleDollarSign/><span><b>{t('usdRate')}</b><small>1 USD = {formatNumber(settings.exchangeRateUSD, 2)} THB</small></span></div></div></div>
      <div className="panel-card"><div className="panel-heading"><div><span>DATA HEALTH</span><h3>Database coverage</h3></div></div><div className="health-list"><Health label={t('packages')} value={packages.length} max={10}/><Health label={t('hotels')} value={hotels.length} max={12}/><Health label={t('users')} value={users.length} max={8}/></div></div>
    </section>
  </div>;
}

function Health({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.min(100, Math.max(8, (value / max) * 100));
  return <div className="health-row"><div><span>{label}</span><b>{value}</b></div><div className="health-track"><i style={{ width: `${percent}%` }}/></div></div>;
}

function HotelsManager({ items, onSave, onDelete }: { items: Hotel[]; onSave: (hotel: Hotel) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<Hotel | null>(null);
  const grouped = useMemo(() => ['3 Stars', '4 Stars', '5 Stars'].map((category) => ({ category, items: items.filter((item) => item.category === category) })), [items]);
  async function remove(item: Hotel) { if (window.confirm(t('confirmDelete'))) await onDelete(item.id); }
  return <div className="admin-stack"><PageAction title={t('hotels')} detail={`${items.length} records`} action={t('addHotel')} onAction={() => setEditing(newHotel())}/>
    <div className="hotel-groups">{grouped.map((group) => <section className="panel-card" key={group.category}><div className="panel-heading"><div><span>HOTEL CATEGORY</span><h3>{group.category}</h3></div><span className="count-badge">{group.items.length}</span></div>{group.items.length ? <div className="data-list">{group.items.map((hotel) => <div className="data-row" key={hotel.id}><span className="data-avatar hotel"><Building2/></span><span className="data-main"><b>{hotel.name}</b><small>1 pax ${hotel.rates.pax1USD} · 2 pax ${hotel.rates.pax2USD} · 3+ pax ${hotel.rates.pax3PlusUSD}</small></span><div className="row-actions"><button onClick={() => setEditing(hotel)}><Pencil/></button><button className="danger" onClick={() => remove(hotel)}><Trash2/></button></div></div>)}</div> : <EmptyState title={t('noData')}/>}</section>)}</div>
    <HotelEditor hotel={editing} onClose={() => setEditing(null)} onSave={async (hotel) => { await onSave(hotel); setEditing(null); }}/>
  </div>;
}

function newHotel(): Hotel { return { id: makeId('htl'), name: '', category: '3 Stars', rates: { pax1USD: 0, pax2USD: 0, pax3PlusUSD: 0 } }; }
function HotelEditor({ hotel, onClose, onSave }: { hotel: Hotel | null; onClose: () => void; onSave: (hotel: Hotel) => Promise<void> }) {
  const { t } = useI18n();
  const [form, setForm] = useState<Hotel | null>(hotel);
  React.useEffect(() => setForm(hotel), [hotel]);
  if (!form) return null;
  const setRate = (key: keyof Hotel['rates'], value: number) => setForm({ ...form, rates: { ...form.rates, [key]: value } });
  return <Modal open={Boolean(hotel)} title={t('hotels')} onClose={onClose}><div className="editor-form"><label className="field"><span>{t('hotel')}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label className="field"><span>{t('category')}</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as HotelCategory })}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label><RateFields rates={form.rates} setRate={setRate}/><div className="modal-actions"><button className="ghost-button" onClick={onClose}>{t('cancel')}</button><button className="primary-button" disabled={!form.name.trim()} onClick={() => onSave(form)}><Save/>{t('save')}</button></div></div></Modal>;
}

function PackagesManager({ items, onSave, onDelete }: { items: TourPackage[]; onSave: (pkg: TourPackage) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const { t, language } = useI18n();
  const [editing, setEditing] = useState<TourPackage | null>(null);
  async function remove(item: TourPackage) { if (window.confirm(t('confirmDelete'))) await onDelete(item.id); }
  const recordLabel = language === 'th' ? `${items.length} รายการ` : `${items.length} records`;
  const sourceTitle = language === 'th' ? 'แหล่งราคาที่ใช้คำนวณ' : 'Price source';
  return <div className="admin-stack"><PageAction title={t('packages')} detail={recordLabel} action={t('addPackage')} onAction={() => setEditing(newPackage())}/><section className="panel-card no-padding">{items.length ? <div className="data-table"><div className="data-table-head"><span>{t('packageName')}</span><span>{t('durationNights')}</span><span>{sourceTitle}</span><span/></div>{items.map((pkg) => <div className="data-table-row" key={pkg.id}><span className="package-cell"><i><PackageOpen/></i><b>{pkg.name}</b></span><span>{pkg.nights} {t('nights')}</span><span className="rate-preview">{language === 'th' ? `เรตแพ็กเกจตามระดับโรงแรม × ${pkg.nights} คืน` : `Hotel-level package rate × ${pkg.nights} nights`}</span><span className="row-actions"><button aria-label={t('edit')} onClick={() => setEditing(pkg)}><Pencil/></button><button aria-label={t('delete')} className="danger" onClick={() => remove(pkg)}><Trash2/></button></span></div>)}</div> : <EmptyState title={t('noData')}/>}</section><PackageEditor pkg={editing} onClose={() => setEditing(null)} onSave={async (pkg) => { await onSave(pkg); setEditing(null); }}/></div>;
}

function newPackage(): TourPackage {
  const base = { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 };
  return { id: makeId('pkg'), name: '', nights: 3, rates: { ...base }, hotelRates: { star3: { ...base }, star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 }, star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 } } };
}
function PackageEditor({ pkg, onClose, onSave }: { pkg: TourPackage | null; onClose: () => void; onSave: (pkg: TourPackage) => Promise<void> }) {
  const { t, language } = useI18n();
  const [form, setForm] = useState<TourPackage | null>(pkg);
  React.useEffect(() => setForm(pkg), [pkg]);
  if (!form) return null;
  return <Modal open={Boolean(pkg)} title={t('packages')} onClose={onClose}><div className="editor-form"><label className="field"><span>{t('packageName')}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label className="field"><span>{t('durationNights')}</span><input type="number" min="1" value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })}/></label><div className="info-banner"><HotelIcon/><span>{language === 'th' ? 'ราคาหน้าคำนวณจะใช้เรตราคาตามระดับโรงแรมของแพ็กเกจ คูณด้วยจำนวนคืน' : 'The calculator uses the package rate for the selected hotel level multiplied by the package duration.'}</span></div><div className="modal-actions"><button className="ghost-button" onClick={onClose}>{t('cancel')}</button><button className="primary-button" disabled={!form.name.trim() || form.nights < 1} onClick={() => onSave(form)}><Save/>{t('save')}</button></div></div></Modal>;
}

function RateFields({ rates, setRate }: { rates: { pax1USD: number; pax2USD: number; pax3PlusUSD: number }; setRate: (key: 'pax1USD' | 'pax2USD' | 'pax3PlusUSD', value: number) => void }) {
  const { t } = useI18n();
  return <div className="rate-fields"><label className="field"><span>{t('rate1')} · USD</span><input type="number" min="0" value={rates.pax1USD} onChange={(e) => setRate('pax1USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate2')} · USD</span><input type="number" min="0" value={rates.pax2USD} onChange={(e) => setRate('pax2USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate3')} · USD</span><input type="number" min="0" value={rates.pax3PlusUSD} onChange={(e) => setRate('pax3PlusUSD', Number(e.target.value))}/></label></div>;
}

function SettingsManager({ initial, onSave, onUploadLogo, onResetLogo }: { initial: GlobalSettings; onSave: (settings: GlobalSettings) => Promise<void>; onUploadLogo: (file: File) => Promise<string>; onResetLogo: () => Promise<void> }) {
  const { t, language } = useI18n();
  const [form, setForm] = useState(initial);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  React.useEffect(() => setForm(initial), [initial]);
  const change = (key: keyof GlobalSettings, value: number) => setForm((current) => ({ ...current, [key]: value }));
  const discount = form.ticketPriceTHB > 0 ? ((form.ticketPriceTHB - (form.agentTicketPriceTHB ?? 0)) / form.ticketPriceTHB) * 100 : 0;
  async function chooseLogo(file?: File) {
    if (!file) return;
    setLogoBusy(true);
    try {
      const url = await onUploadLogo(file);
      setForm((current) => ({ ...current, logoUrl: url }));
    } finally {
      setLogoBusy(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }
  async function resetBrand() {
    setLogoBusy(true);
    try {
      await onResetLogo();
      setForm((current) => ({ ...current, logoUrl: '' }));
    } finally { setLogoBusy(false); }
  }
  return <div className="admin-stack"><PageAction title={t('pricingSettings')} detail="Retail · Agent · USD · Visa · Branding"/>
  <section className="branding-settings-card">
    <div className="branding-preview"><span className="branding-preview-label">{language === 'th' ? 'ตัวอย่างโลโก้ในเว็บไซต์และเอกสาร' : 'Website and document logo preview'}</span><div className="branding-preview-canvas"><Brand logoUrl={form.logoUrl}/></div></div>
    <div className="branding-actions"><div className="settings-card-title"><span><Settings2/></span><div><h3>{language === 'th' ? 'โลโก้บริษัท' : 'Company logo'}</h3><p>{language === 'th' ? 'อัปโหลดครั้งเดียว โลโก้จะเปลี่ยนบนเว็บไซต์ ใบเสนอราคา และ Invoice' : 'Upload once to update the website, quotations and invoices.'}</p></div></div><p className="branding-file-hint">PNG, JPG หรือ WEBP · ไม่เกิน 2 MB · แนะนำพื้นหลังโปร่งใส</p><input ref={logoInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseLogo(event.target.files?.[0])}/><div className="branding-button-row"><button className="primary-button" disabled={logoBusy} onClick={() => logoInputRef.current?.click()}><Plus/>{logoBusy ? (language === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...') : (language === 'th' ? 'อัปเดตโลโก้' : 'Update logo')}</button><button className="ghost-button" disabled={logoBusy || !form.logoUrl} onClick={resetBrand}><RefreshCw/>{language === 'th' ? 'ใช้โลโก้เริ่มต้น' : 'Use default logo'}</button></div></div>
  </section>
  <div className="settings-grid">
    <section className="settings-card"><div className="settings-card-title"><span><Plane/></span><div><h3>{t('flightPricing')}</h3><p>THB / person</p></div></div><NumberField label={t('retailFlight')} value={form.ticketPriceTHB} onChange={(v) => change('ticketPriceTHB', v)}/><NumberField label={t('agentFlight')} value={form.agentTicketPriceTHB ?? 25220} onChange={(v) => change('agentTicketPriceTHB', v)}/><div className="calculated-note"><BadgePercent/> {t('agentDiscount')}: <b>{formatNumber(discount, 2)}%</b></div><NumberField label={t('airportTaxLabel')} value={form.airportTaxTHB} onChange={(v) => change('airportTaxTHB', v)}/></section>
    <section className="settings-card"><div className="settings-card-title"><span><CircleDollarSign/></span><div><h3>{t('exchangeVisa')}</h3><p>Global conversion</p></div></div><NumberField label={t('usdRate')} value={form.exchangeRateUSD} onChange={(v) => change('exchangeRateUSD', v)} step="0.01" suffix="THB"/><NumberField label={t('visaFee')} value={form.visaFeeUSD} onChange={(v) => change('visaFeeUSD', v)} suffix="USD"/></section>
    <section className="settings-card"><div className="settings-card-title"><span><BadgePercent/></span><div><h3>{t('margins')}</h3><p>THB / person</p></div></div><NumberField label={t('retailMargin')} value={form.marginTHB} onChange={(v) => change('marginTHB', v)}/><NumberField label={t('agentMargin')} value={form.agentMarginTHB ?? 3000} onChange={(v) => change('agentMarginTHB', v)}/></section>
    <section className="settings-card group-discount-settings"><div className="settings-card-title"><span><Users/></span><div><h3>{t('groupDiscountSettings')}</h3><p>{t('groupDiscountHint')}</p></div></div><div className="group-discount-fields"><NumberField label={t('groupDiscountMinPax')} value={form.groupDiscountMinPax ?? 10} onChange={(v) => change('groupDiscountMinPax', Math.max(1, Math.round(v)))} min={1} suffix={t('people')}/><NumberField label={t('groupDiscountPercent')} value={form.groupDiscountPercent ?? 10} onChange={(v) => change('groupDiscountPercent', Math.min(100, Math.max(0, v)))} step="0.01" min={0} max={100} suffix="%"/></div><div className="group-discount-preview"><BadgePercent/><span>{(form.groupDiscountMinPax ?? 10)} {t('people')}+ · {formatNumber(form.groupDiscountPercent ?? 10, Number.isInteger(form.groupDiscountPercent ?? 10) ? 0 : 2)}%</span></div></section>
    <section className="settings-card"><div className="settings-card-title"><span><HotelIcon/></span><div><h3>{t('legacyHotelDefaults')}</h3><p>Fallback only</p></div></div><div className="mini-rate-grid"><NumberField label="3★ · 1 pax" value={form.hotel3StarPax1USD} onChange={(v) => change('hotel3StarPax1USD', v)} suffix="USD"/><NumberField label="3★ · 2 pax" value={form.hotel3StarPax2USD} onChange={(v) => change('hotel3StarPax2USD', v)} suffix="USD"/><NumberField label="3★ · 3+ pax" value={form.hotel3StarPax3PlusUSD} onChange={(v) => change('hotel3StarPax3PlusUSD', v)} suffix="USD"/><NumberField label="4★ · 1 pax" value={form.hotel4StarPax1USD} onChange={(v) => change('hotel4StarPax1USD', v)} suffix="USD"/><NumberField label="4★ · 2 pax" value={form.hotel4StarPax2USD} onChange={(v) => change('hotel4StarPax2USD', v)} suffix="USD"/><NumberField label="4★ · 3+ pax" value={form.hotel4StarPax3PlusUSD} onChange={(v) => change('hotel4StarPax3PlusUSD', v)} suffix="USD"/></div></section>
  </div><button className="primary-button save-settings-button" onClick={() => onSave(form)}><Save/>{t('saveSettings')}</button></div>;
}

function NumberField({ label, value, onChange, step = '1', suffix = 'THB', min = 0, max }: { label: string; value: number; onChange: (value: number) => void; step?: string; suffix?: string; min?: number; max?: number }) {
  return <label className="field number-field"><span>{label}</span><div><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/><em>{suffix}</em></div></label>;
}

function UsersManager({ items, currentUser, onSave, onDelete }: { items: User[]; currentUser: User; onSave: (user: User) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const { t } = useI18n();
  async function remove(item: User) { if (item.id !== currentUser.id && window.confirm(t('confirmDelete'))) await onDelete(item.id); }
  return <div className="admin-stack"><PageAction title={t('users')} detail={`${items.length} accounts`}/><div className="info-banner"><ShieldCheck/><span>{t('userNote')}</span></div><section className="panel-card no-padding">{items.map((user) => <div className="user-row" key={user.id}><span className="user-avatar-lg">{user.name?.[0]?.toUpperCase()}</span><span className="data-main"><b>{user.name}</b><small>{user.email}</small></span><select value={user.role} disabled={user.id === currentUser.id} onChange={(event) => onSave({ ...user, role: event.target.value as User['role'] })}><option value="admin">{t('admin')}</option><option value="sales">{t('sales')}</option></select><button className="icon-button danger" disabled={user.id === currentUser.id} onClick={() => remove(user)}><Trash2/></button></div>)}</section></div>;
}

function PageAction({ title, detail, action, onAction }: { title: string; detail?: string; action?: string; onAction?: () => void }) {
  return <div className="page-action"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action && onAction && <button className="primary-button" onClick={onAction}><Plus/>{action}</button>}</div>;
}
