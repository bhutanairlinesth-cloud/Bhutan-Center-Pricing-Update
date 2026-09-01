import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BadgePercent, Building2, CheckCircle2, ChevronRight, CircleDollarSign, Copy, Database,
  Eye, EyeOff, Gauge, Hotel as HotelIcon, KeyRound, LayoutDashboard, LogOut, Mail, Menu, PackageOpen, Pencil,
  Plane, Plus, RefreshCw, Save, Settings2, ShieldCheck, Trash2, UserPlus, Users, WandSparkles, X,
} from 'lucide-react';
import { CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, HotelCategory, PaymentInvoice, PaymentTransaction, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { formatNumber, formatTHB, makeId } from '../utils/format';
import { Brand } from './Brand';
import { EmptyState, Modal } from './Ui';
import { SalesDashboard } from './SalesDashboard';

type AdminPage = 'dashboard' | 'overview' | 'packages' | 'hotels' | 'settings' | 'users';

interface AdminProps {
  settings: GlobalSettings;
  hotels: Hotel[];
  packages: TourPackage[];
  users: User[];
  trackings: CustomerTracking[];
  invoices: PaymentInvoice[];
  payments: PaymentTransaction[];
  currentUser: User;
  mode: 'supabase' | 'local';
  onBack: () => void;
  onOpenTracking: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onSaveSettings: (settings: GlobalSettings) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string>;
  onResetLogo: () => Promise<void>;
  onSaveHotel: (hotel: Hotel) => Promise<void>;
  onDeleteHotel: (id: string) => Promise<void>;
  onSavePackage: (pkg: TourPackage) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onCreateUser: (input: CreateSystemUserInput) => Promise<User>;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export function Admin({ settings, hotels, packages, users, trackings, invoices, payments, currentUser, mode, onBack, onOpenTracking, onLogout, onRefresh, onSaveSettings, onUploadLogo, onResetLogo, onSaveHotel, onDeleteHotel, onSavePackage, onDeletePackage, onCreateUser, onSaveUser, onDeleteUser }: AdminProps) {
  const { t, language } = useI18n();
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { id: 'dashboard' as const, label: language === 'th' ? 'Dashboard รายงาน' : 'Sales dashboard', icon: LayoutDashboard },
    { id: 'overview' as const, label: language === 'th' ? 'ข้อมูลราคาและระบบ' : 'Pricing & system data', icon: Database },
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
        {page === 'dashboard' && <SalesDashboard trackings={trackings} invoices={invoices} payments={payments} onOpenTracking={onOpenTracking}/>} 
        {page === 'overview' && <AdminOverview settings={settings} hotels={hotels} packages={packages} users={users} language={language} onOpen={setPage}/>} 
        {page === 'packages' && <PackagesManager items={packages} onSave={onSavePackage} onDelete={onDeletePackage}/>} 
        {page === 'hotels' && <HotelsManager items={hotels} onSave={onSaveHotel} onDelete={onDeleteHotel}/>} 
        {page === 'settings' && <SettingsManager initial={settings} onSave={onSaveSettings} onUploadLogo={onUploadLogo} onResetLogo={onResetLogo}/>} 
        {page === 'users' && <UsersManager items={users} currentUser={currentUser} mode={mode} onCreate={onCreateUser} onSave={onSaveUser} onDelete={onDeleteUser}/>} 
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
  const sourceTitle = language === 'th' ? 'พักเดี่ยวเพิ่ม / ท่าน' : 'Single supplement / pax';
  return <div className="admin-stack">
    <PageAction title={t('packages')} detail={recordLabel} action={t('addPackage')} onAction={() => setEditing(newPackage())}/>
    <section className="panel-card no-padding">{items.length ? <div className="data-table">
      <div className="data-table-head"><span>{t('packageName')}</span><span>{t('durationNights')}</span><span>{sourceTitle}</span><span/></div>
      {items.map((pkg) => {
        const single = pkg.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 };
        return <div className="data-table-row" key={pkg.id}>
          <span className="package-cell"><i><PackageOpen/></i><b>{pkg.name}</b></span>
          <span>{pkg.nights} {t('nights')}</span>
          <span className="rate-preview single-supplement-preview">
            <b>3★ {formatTHB(single.star3, language)}</b>
            <b>4★ {formatTHB(single.star4, language)}</b>
            <b>5★ {formatTHB(single.star5, language)}</b>
          </span>
          <span className="row-actions"><button aria-label={t('edit')} onClick={() => setEditing(pkg)}><Pencil/></button><button aria-label={t('delete')} className="danger" onClick={() => remove(pkg)}><Trash2/></button></span>
        </div>;
      })}
    </div> : <EmptyState title={t('noData')}/>}</section>
    <PackageEditor pkg={editing} onClose={() => setEditing(null)} onSave={async (pkg) => { await onSave(pkg); setEditing(null); }}/>
  </div>;
}

function newPackage(): TourPackage {
  const base = { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 };
  return {
    id: makeId('pkg'),
    name: '',
    nights: 3,
    rates: { ...base },
    hotelRates: {
      star3: { ...base },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 },
    },
    singleSupplementsTHB: { star3: 0, star4: 0, star5: 0 },
  };
}

function PackageEditor({ pkg, onClose, onSave }: { pkg: TourPackage | null; onClose: () => void; onSave: (pkg: TourPackage) => Promise<void> }) {
  const { t, language } = useI18n();
  const [form, setForm] = useState<TourPackage | null>(pkg);
  React.useEffect(() => setForm(pkg ? {
    ...pkg,
    singleSupplementsTHB: pkg.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 },
  } : null), [pkg]);
  if (!form) return null;
  const setSingle = (key: 'star3' | 'star4' | 'star5', value: number) => setForm({
    ...form,
    singleSupplementsTHB: { ...(form.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 }), [key]: Math.max(0, value) },
  });
  const single = form.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 };
  return <Modal open={Boolean(pkg)} title={t('packages')} onClose={onClose}>
    <div className="editor-form package-editor-form">
      <label className="field"><span>{t('packageName')}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label className="field"><span>{t('durationNights')}</span><input type="number" min="1" value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })}/></label>
      <section className="single-supplement-editor">
        <div className="settings-card-title"><span><HotelIcon/></span><div><h3>{language === 'th' ? 'ส่วนต่างพักเดี่ยว' : 'Single-room supplement'}</h3><p>{language === 'th' ? 'กำหนดราคาเพิ่มต่อผู้พักเดี่ยว 1 ท่าน สำหรับแพ็กเกจนี้ทั้งทริป' : 'Set the extra charge per single-room traveller for the entire package.'}</p></div></div>
        <div className="single-supplement-fields">
          <NumberField label="3 Stars" value={single.star3} onChange={(v) => setSingle('star3', v)} suffix="THB / pax"/>
          <NumberField label="4 Stars" value={single.star4} onChange={(v) => setSingle('star4', v)} suffix="THB / pax"/>
          <NumberField label="5 Stars" value={single.star5} onChange={(v) => setSingle('star5', v)} suffix="THB / pax"/>
        </div>
        <div className="info-banner"><HotelIcon/><span>{language === 'th' ? 'หน้าคำนวณสามารถเลือกผู้พักเดี่ยวได้หลายท่าน และแก้ราคาเฉพาะเคสได้ โดยไม่เปลี่ยนราคาตั้งต้นนี้' : 'The calculator supports multiple single rooms and allows a case-specific override without changing this default.'}</span></div>
      </section>
      <div className="modal-actions"><button className="ghost-button" onClick={onClose}>{t('cancel')}</button><button className="primary-button" disabled={!form.name.trim() || form.nights < 1} onClick={() => onSave(form)}><Save/>{t('save')}</button></div>
    </div>
  </Modal>;
}

function RateFields({ rates, setRate }: { rates: { pax1USD: number; pax2USD: number; pax3PlusUSD: number }; setRate: (key: 'pax1USD' | 'pax2USD' | 'pax3PlusUSD', value: number) => void }) {
  const { t } = useI18n();
  return <div className="rate-fields"><label className="field"><span>{t('rate1')} · USD</span><input type="number" min="0" value={rates.pax1USD} onChange={(e) => setRate('pax1USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate2')} · USD</span><input type="number" min="0" value={rates.pax2USD} onChange={(e) => setRate('pax2USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate3')} · USD</span><input type="number" min="0" value={rates.pax3PlusUSD} onChange={(e) => setRate('pax3PlusUSD', Number(e.target.value))}/></label></div>;
}

function SettingsManager({ initial, onSave, onUploadLogo, onResetLogo }: { initial: GlobalSettings; onSave: (settings: GlobalSettings) => Promise<void>; onUploadLogo: (file: File) => Promise<string>; onResetLogo: () => Promise<void> }) {
  const { t, language } = useI18n();
  const [form, setForm] = useState(initial);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  React.useEffect(() => setForm(initial), [initial]);
  const change = (key: keyof GlobalSettings, value: number) => setForm((current) => ({ ...current, [key]: value }));
  const changeText = (key: keyof GlobalSettings, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const discount = form.ticketPriceTHB > 0 ? ((form.ticketPriceTHB - (form.agentTicketPriceTHB ?? 0)) / form.ticketPriceTHB) * 100 : 0;
  async function chooseLogo(file?: File) {
    if (!file || logoBusy) return;
    setLogoError('');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setLogoError(language === 'th' ? 'รองรับเฉพาะ PNG, JPG หรือ WEBP' : 'Only PNG, JPG or WEBP files are supported.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError(language === 'th' ? 'ไฟล์โลโก้ต้องมีขนาดไม่เกิน 2 MB' : 'Logo file must be 2 MB or smaller.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    setLogoBusy(true);
    try {
      const url = await onUploadLogo(file);
      setForm((current) => ({ ...current, logoUrl: url }));
    } catch (error: any) {
      console.error('Logo upload failed', error);
      setLogoError(error?.message || (language === 'th' ? 'อัปโหลดโลโก้ไม่สำเร็จ' : 'Logo upload failed.'));
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
    <div className="branding-actions"><div className="settings-card-title"><span><Settings2/></span><div><h3>{language === 'th' ? 'โลโก้บริษัท' : 'Company logo'}</h3><p>{language === 'th' ? 'อัปโหลดครั้งเดียว โลโก้จะเปลี่ยนบนเว็บไซต์ ใบเสนอราคา และ Invoice' : 'Upload once to update the website, quotations and invoices.'}</p></div></div><p className="branding-file-hint">PNG, JPG หรือ WEBP · ไม่เกิน 2 MB · แนะนำพื้นหลังโปร่งใส</p><input ref={logoInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseLogo(event.target.files?.[0])}/><div className="branding-button-row"><button type="button" className="primary-button" disabled={logoBusy} onClick={() => logoInputRef.current?.click()}><Plus/>{logoBusy ? (language === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...') : (language === 'th' ? 'อัปเดตโลโก้' : 'Update logo')}</button><button type="button" className="ghost-button" disabled={logoBusy || !form.logoUrl} onClick={resetBrand}><RefreshCw/>{language === 'th' ? 'ใช้โลโก้เริ่มต้น' : 'Use default logo'}</button></div>{logoError && <div className="upload-inline-error" role="alert">{logoError}</div>}</div>
  </section>
  <section className="payment-account-settings">
    <div className="settings-card-title payment-account-title"><span><Building2/></span><div><h3>{language === 'th' ? 'บัญชีรับชำระใน Invoice' : 'Invoice payment accounts'}</h3><p>{language === 'th' ? 'กำหนดข้อมูลบัญชีธนาคารที่จะแสดงในเอกสารเรียกเก็บเงิน' : 'Configure the bank account details shown on invoices.'}</p></div></div>
    <div className="payment-account-grid">
      <PaymentAccountSettingsCard language={language} title={language === 'th' ? 'บัญชีบริษัท · ค่าเริ่มต้น Invoice 1' : 'Company account · default for Invoice 1'} bankName={form.companyBankName ?? 'ธนาคารกสิกรไทย'} accountName={form.companyAccountName ?? 'บริษัท OMG Experience Co., Ltd.'} accountNumber={form.companyAccountNumber ?? '051-2-51692-0'} onBankName={(v) => changeText('companyBankName', v)} onAccountName={(v) => changeText('companyAccountName', v)} onAccountNumber={(v) => changeText('companyAccountNumber', v)}/>
      <PaymentAccountSettingsCard language={language} title={language === 'th' ? 'บัญชีเจ้านาย · ค่าเริ่มต้น Invoice 2' : 'Owner account · default for Invoice 2'} bankName={form.ownerBankName ?? 'ธนาคารไทยพาณิชย์'} accountName={form.ownerAccountName ?? 'นายศิเวก สัจเดว'} accountNumber={form.ownerAccountNumber ?? '203-215366-9'} onBankName={(v) => changeText('ownerBankName', v)} onAccountName={(v) => changeText('ownerAccountName', v)} onAccountNumber={(v) => changeText('ownerAccountNumber', v)}/>
    </div>
    <div className="vat-setting-row"><NumberField label={language === 'th' ? 'VAT สำหรับ Invoice 2 ที่ขอใบกำกับภาษี' : 'VAT rate for Invoice 2 tax invoice'} value={form.vatRatePercent ?? 7} onChange={(v) => change('vatRatePercent', Math.min(100, Math.max(0, v)))} step="0.01" suffix="%"/></div>
  </section>
  <div className="settings-grid">
    <section className="settings-card"><div className="settings-card-title"><span><Plane/></span><div><h3>{t('flightPricing')}</h3><p>THB / person</p></div></div><NumberField label={t('retailFlight')} value={form.ticketPriceTHB} onChange={(v) => change('ticketPriceTHB', v)}/><NumberField label={t('agentFlight')} value={form.agentTicketPriceTHB ?? 25220} onChange={(v) => change('agentTicketPriceTHB', v)}/><div className="calculated-note"><BadgePercent/> {t('agentDiscount')}: <b>{formatNumber(discount, 2)}%</b></div><NumberField label={t('airportTaxLabel')} value={form.airportTaxTHB} onChange={(v) => change('airportTaxTHB', v)}/><NumberField label={language === 'th' ? 'ส่วนเพิ่มราคาขาย Business Class / ท่าน' : 'Business Class selling surcharge / pax'} value={form.businessUpgradeTHB ?? 15000} onChange={(v) => change('businessUpgradeTHB', v)}/></section>
    <section className="settings-card"><div className="settings-card-title"><span><CircleDollarSign/></span><div><h3>{t('exchangeVisa')}</h3><p>Global conversion</p></div></div><NumberField label={t('usdRate')} value={form.exchangeRateUSD} onChange={(v) => change('exchangeRateUSD', v)} step="0.01" suffix="THB"/><NumberField label={t('visaFee')} value={form.visaFeeUSD} onChange={(v) => change('visaFeeUSD', v)} suffix="USD"/></section>
    <section className="settings-card"><div className="settings-card-title"><span><BadgePercent/></span><div><h3>{t('margins')}</h3><p>THB / person</p></div></div><NumberField label={t('retailMargin')} value={form.marginTHB} onChange={(v) => change('marginTHB', v)}/><NumberField label={t('agentMargin')} value={form.agentMarginTHB ?? 3000} onChange={(v) => change('agentMarginTHB', v)}/></section>
    <section className="settings-card group-discount-settings"><div className="settings-card-title"><span><Users/></span><div><h3>{t('groupDiscountSettings')}</h3><p>{t('groupDiscountHint')}</p></div></div><div className="group-discount-fields"><NumberField label={t('groupDiscountMinPax')} value={form.groupDiscountMinPax ?? 10} onChange={(v) => change('groupDiscountMinPax', Math.max(1, Math.round(v)))} min={1} suffix={t('people')}/><NumberField label={t('groupDiscountPercent')} value={form.groupDiscountPercent ?? 10} onChange={(v) => change('groupDiscountPercent', Math.min(100, Math.max(0, v)))} step="0.01" min={0} max={100} suffix="%"/></div><div className="group-discount-preview"><BadgePercent/><span>{(form.groupDiscountMinPax ?? 10)} {t('people')}+ · {formatNumber(form.groupDiscountPercent ?? 10, Number.isInteger(form.groupDiscountPercent ?? 10) ? 0 : 2)}%</span></div></section>
    <section className="settings-card"><div className="settings-card-title"><span><HotelIcon/></span><div><h3>{t('legacyHotelDefaults')}</h3><p>Fallback only</p></div></div><div className="mini-rate-grid"><NumberField label="3★ · 1 pax" value={form.hotel3StarPax1USD} onChange={(v) => change('hotel3StarPax1USD', v)} suffix="USD"/><NumberField label="3★ · 2 pax" value={form.hotel3StarPax2USD} onChange={(v) => change('hotel3StarPax2USD', v)} suffix="USD"/><NumberField label="3★ · 3+ pax" value={form.hotel3StarPax3PlusUSD} onChange={(v) => change('hotel3StarPax3PlusUSD', v)} suffix="USD"/><NumberField label="4★ · 1 pax" value={form.hotel4StarPax1USD} onChange={(v) => change('hotel4StarPax1USD', v)} suffix="USD"/><NumberField label="4★ · 2 pax" value={form.hotel4StarPax2USD} onChange={(v) => change('hotel4StarPax2USD', v)} suffix="USD"/><NumberField label="4★ · 3+ pax" value={form.hotel4StarPax3PlusUSD} onChange={(v) => change('hotel4StarPax3PlusUSD', v)} suffix="USD"/></div></section>
  </div><button className="primary-button save-settings-button" onClick={() => onSave(form)}><Save/>{t('saveSettings')}</button></div>;
}


function PaymentAccountSettingsCard({ language, title, bankName, accountName, accountNumber, onBankName, onAccountName, onAccountNumber }: { language: 'th' | 'en'; title: string; bankName: string; accountName: string; accountNumber: string; onBankName: (value: string) => void; onAccountName: (value: string) => void; onAccountNumber: (value: string) => void }) {
  return <article className="payment-account-card"><div className="payment-account-card-head"><div><b>{title}</b><small>{language === 'th' ? 'ข้อมูลบัญชีนี้จะแสดงใน Invoice ที่เลือกบัญชีนี้' : 'These bank details appear on invoices using this account.'}</small></div></div><label className="field"><span>{language === 'th' ? 'ธนาคาร' : 'Bank'}</span><input value={bankName} onChange={(e) => onBankName(e.target.value)}/></label><label className="field"><span>{language === 'th' ? 'ชื่อบัญชี' : 'Account name'}</span><input value={accountName} onChange={(e) => onAccountName(e.target.value)}/></label><label className="field"><span>{language === 'th' ? 'เลขที่บัญชี' : 'Account number'}</span><input value={accountNumber} onChange={(e) => onAccountNumber(e.target.value)}/></label></article>;
}

function NumberField({ label, value, onChange, step = '1', suffix = 'THB', min = 0, max }: { label: string; value: number; onChange: (value: number) => void; step?: string; suffix?: string; min?: number; max?: number }) {
  return <label className="field number-field"><span>{label}</span><div><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/><em>{suffix}</em></div></label>;
}

function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const pick = (value: string) => value[Math.floor(Math.random() * value.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const pool = upper + lower + digits + symbols;
  while (chars.length < 12) chars.push(pick(pool));
  return chars.sort(() => Math.random() - 0.5).join('');
}

function UsersManager({ items, currentUser, mode, onCreate, onSave, onDelete }: {
  items: User[];
  currentUser: User;
  mode: 'supabase' | 'local';
  onCreate: (input: CreateSystemUserInput) => Promise<User>;
  onSave: (user: User) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const [creating, setCreating] = useState(false);
  async function remove(item: User) {
    if (item.id !== currentUser.id && window.confirm(language === 'th' ? `ลบบัญชี ${item.email} ออกจากระบบใช่หรือไม่` : `Delete ${item.email} from the system?`)) await onDelete(item.id);
  }
  return <div className="admin-stack user-management-page">
    <div className="user-management-heading">
      <div><span className="version-chip">v12.7.0</span><h2>{t('users')}</h2><p>{language === 'th' ? `${items.length} บัญชี · สร้างบัญชี Supabase พร้อมรหัสผ่านชั่วคราว` : `${items.length} accounts · Create Supabase accounts with a temporary password`}</p></div>
      <button className="primary-button user-add-primary" onClick={() => setCreating(true)}><UserPlus/>{language === 'th' ? 'เพิ่มผู้ใช้งาน' : 'Add user'}</button>
    </div>
    <div className="info-banner user-create-banner"><ShieldCheck/><span>{language === 'th' ? 'เพิ่มบัญชีจากหน้านี้ได้โดยตรง ไม่ต้องไปสร้างใน Supabase Authentication ก่อน' : 'Create accounts directly from this page; no manual Supabase Authentication step is required.'}</span><button type="button" onClick={() => setCreating(true)}><Plus/>{language === 'th' ? 'สร้างบัญชีใหม่' : 'Create account'}</button></div>
    {mode === 'supabase' && <div className="user-security-note"><KeyRound/><span>{language === 'th' ? 'รหัสผ่านจะแสดงเพียงครั้งเดียวหลังสร้างบัญชี กรุณาคัดลอกและส่งให้พนักงานผ่านช่องทางที่ปลอดภัย' : 'The password is shown once after account creation. Copy it and share it securely.'}</span></div>}
    <section className="panel-card no-padding">
      {items.length ? items.map((user) => <div className="user-row" key={user.id}>
        <span className="user-avatar-lg">{user.name?.[0]?.toUpperCase()}</span>
        <span className="data-main"><b>{user.name}</b><small>{user.email}</small></span>
        <span className={`user-role-badge ${user.role}`}>{user.role === 'admin' ? t('admin') : t('sales')}</span>
        <select value={user.role} disabled={user.id === currentUser.id} onChange={(event) => onSave({ ...user, role: event.target.value as User['role'] })}>
          <option value="admin">{t('admin')}</option><option value="sales">{t('sales')}</option>
        </select>
        <button className="icon-button danger" disabled={user.id === currentUser.id} onClick={() => remove(user)} title={language === 'th' ? 'ลบบัญชี' : 'Delete account'}><Trash2/></button>
      </div>) : <EmptyState title={language === 'th' ? 'ยังไม่มีผู้ใช้งาน' : 'No users yet'} detail={language === 'th' ? 'กดเพิ่มผู้ใช้งานเพื่อสร้างบัญชีแรก' : 'Add the first user account.'}/>} 
    </section>
    <CreateUserModal open={creating} existingEmails={items.map((item) => item.email)} onClose={() => setCreating(false)} onCreate={onCreate}/>
  </div>;
}

function CreateUserModal({ open, existingEmails, onClose, onCreate }: {
  open: boolean;
  existingEmails: string[];
  onClose: () => void;
  onCreate: (input: CreateSystemUserInput) => Promise<User>;
}) {
  const { language } = useI18n();
  const initialPassword = () => generateTemporaryPassword();
  const [form, setForm] = useState<CreateSystemUserInput>({ name: '', email: '', password: initialPassword(), role: 'sales' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ user: User; password: string } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm({ name: '', email: '', password: initialPassword(), role: 'sales' });
    setShowPassword(false);
    setBusy(false);
    setError('');
    setCreated(null);
  }, [open]);

  const close = () => { if (!busy) onClose(); };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
  };
  const credentials = created ? `Bhutan Center Pricing\nEmail: ${created.user.email}\nPassword: ${created.password}` : '';

  async function submit() {
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim()) return setError(language === 'th' ? 'กรุณากรอกชื่อผู้ใช้งาน' : 'Enter the user name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(language === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email address.');
    if (existingEmails.some((item) => item.toLowerCase() === email)) return setError(language === 'th' ? 'อีเมลนี้มีอยู่ในระบบแล้ว' : 'This email already exists.');
    if (form.password.length < 8) return setError(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must contain at least 8 characters.');
    setBusy(true);
    try {
      const password = form.password;
      const user = await onCreate({ ...form, name: form.name.trim(), email });
      setCreated({ user, password });
    } catch (err: any) {
      setError(err?.message || (language === 'th' ? 'สร้างบัญชีไม่สำเร็จ' : 'Could not create the account.'));
    } finally { setBusy(false); }
  }

  return <Modal open={open} title={created ? (language === 'th' ? 'สร้างบัญชีเรียบร้อยแล้ว' : 'Account created') : (language === 'th' ? 'เพิ่มผู้ใช้งานระบบ' : 'Add system user')} onClose={close}>
    {created ? <div className="user-created-panel">
      <span className="user-created-icon"><CheckCircle2/></span>
      <h3>{language === 'th' ? 'บัญชีพร้อมใช้งานทันที' : 'The account is ready'}</h3>
      <p>{language === 'th' ? 'คัดลอกข้อมูลด้านล่างและส่งให้ผู้ใช้งาน รหัสผ่านนี้จะไม่สามารถเรียกดูย้อนหลังจากระบบได้' : 'Copy the credentials below and share them securely. The password cannot be viewed again.'}</p>
      <div className="credential-box"><span><Mail/><small>Email</small><b>{created.user.email}</b></span><span><KeyRound/><small>{language === 'th' ? 'รหัสผ่านชั่วคราว' : 'Temporary password'}</small><b>{created.password}</b></span></div>
      <button className="primary-button full-width" onClick={() => copy(credentials)}><Copy/>{language === 'th' ? 'คัดลอกข้อมูลเข้าสู่ระบบ' : 'Copy login details'}</button>
      <button className="ghost-button full-width" onClick={onClose}>{language === 'th' ? 'เสร็จสิ้น' : 'Done'}</button>
    </div> : <div className="user-create-form">
      <div className="user-create-intro"><span><UserPlus/></span><div><h3>{language === 'th' ? 'สร้างบัญชีพนักงานใหม่' : 'Create a staff account'}</h3><p>{language === 'th' ? 'กำหนดชื่อ อีเมล สิทธิ์ และรหัสผ่านชั่วคราว ผู้ใช้งานสามารถเข้าสู่ระบบได้ทันที' : 'Set the name, email, role and temporary password.'}</p></div></div>
      {error && <div className="form-error">{error}</div>}
      <label className="field"><span>{language === 'th' ? 'ชื่อผู้ใช้งาน' : 'Name'}</span><input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={language === 'th' ? 'เช่น Nattanachai' : 'e.g. Nattanachai'}/></label>
      <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@company.com"/></label>
      <label className="field"><span>{language === 'th' ? 'สิทธิ์การใช้งาน' : 'Role'}</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as User['role'] }))}><option value="sales">Sales — {language === 'th' ? 'คำนวณราคาและติดตามลูกค้า' : 'Pricing and customer tracking'}</option><option value="admin">Admin — {language === 'th' ? 'จัดการข้อมูลและผู้ใช้งานทั้งหมด' : 'Full system management'}</option></select></label>
      <label className="field"><span>{language === 'th' ? 'รหัสผ่านชั่วคราว' : 'Temporary password'}</span><div className="password-create-field"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}/><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff/> : <Eye/>}</button><button type="button" onClick={() => setForm((current) => ({ ...current, password: generateTemporaryPassword() }))}><WandSparkles/></button><button type="button" onClick={() => copy(form.password)}><Copy/></button></div><small className="field-help">{language === 'th' ? 'อย่างน้อย 8 ตัวอักษร ปุ่มประกายดาวใช้สร้างรหัสใหม่' : 'At least 8 characters. Use the sparkle button to generate a new password.'}</small></label>
      <div className="modal-actions"><button className="ghost-button" disabled={busy} onClick={close}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</button><button className="primary-button" disabled={busy} onClick={submit}><UserPlus/>{busy ? (language === 'th' ? 'กำลังสร้างบัญชี...' : 'Creating...') : (language === 'th' ? 'สร้างบัญชี' : 'Create account')}</button></div>
    </div>}
  </Modal>;
}

function PageAction({ title, detail, action, onAction }: { title: string; detail?: string; action?: string; onAction?: () => void }) {
  return <div className="page-action"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action && onAction && <button className="primary-button" onClick={onAction}><Plus/>{action}</button>}</div>;
}
