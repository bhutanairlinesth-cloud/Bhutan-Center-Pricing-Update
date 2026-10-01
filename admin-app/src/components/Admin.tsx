import React, { useMemo, useRef, useState } from 'react';
import {
  BadgePercent, Building2, Check, CheckCircle2, ChevronRight, CircleDollarSign, Copy, Database,
  Eye, EyeOff, Gauge, Hotel as HotelIcon, KeyRound, LayoutDashboard, Mail, PackageOpen, Pencil,
  Plane, Plus, ReceiptText, RefreshCw, Save, Settings2, ShieldCheck, Trash2, UserPlus, Users, WandSparkles, X,
} from 'lucide-react';
import { CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, HotelCategory, PaymentInvoice, PaymentTransaction, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { formatNumber, formatTHB, makeId } from '../utils/format';
import { Brand } from './Brand';
import { EmptyState } from './Ui';
import { SalesDashboard } from './SalesDashboard';
import { FormActionBar, PageHeader, SectionCard } from '../shared/ui';
import { ListPage } from '../shared/ListPage';
import { StatusBadge } from '../shared/StatusBadge';

type AdminPage = 'dashboard' | 'overview' | 'packages' | 'hotels' | 'settings' | 'company' | 'users';


const ADMIN_PAGE_PATHS: Record<AdminPage, string> = {
  dashboard: '/admin/settings',
  overview: '/admin/settings/data',
  packages: '/admin/settings/packages',
  hotels: '/admin/settings/hotels',
  settings: '/admin/settings/pricing',
  company: '/admin/settings/company',
  users: '/admin/settings/users',
};

function adminPageFromPath(pathname: string): AdminPage {
  const path = pathname.replace(/\/+$/, '');
  if (path.startsWith('/admin/settings/packages')) return 'packages';
  if (path.startsWith('/admin/settings/hotels')) return 'hotels';
  if (path.startsWith('/admin/settings/pricing')) return 'settings';
  if (path.startsWith('/admin/settings/company')) return 'company';
  if (path.startsWith('/admin/settings/users')) return 'users';
  if (path.startsWith('/admin/settings/data')) return 'settings';
  if (path.startsWith('/admin/settings/hotels')) return 'packages';
  return 'dashboard';
}

interface AdminProps {
  embedded?: boolean;
  /** When embedded, force which master sub-page to show (sidebar handles nav). */
  masterPage?: AdminPage;
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
  detailId?: string;
  onNavigate?: (path: string) => void;
}

export function Admin({ embedded = false, masterPage, settings, hotels, packages, users, trackings, invoices, payments, currentUser, mode, onBack, onOpenTracking, onLogout, onRefresh, onSaveSettings, onUploadLogo, onResetLogo, onSaveHotel, onDeleteHotel, onSavePackage, onDeletePackage, onCreateUser, onSaveUser, onDeleteUser, detailId, onNavigate }: AdminProps) {
  const { t, language } = useI18n();
  const [page, setPage] = useState<AdminPage>(() => masterPage || adminPageFromPath(typeof window !== 'undefined' ? window.location.pathname : '/admin/settings'));
  const nav = [
    { id: 'dashboard' as const, label: language === 'th' ? 'รายงานยอดขาย' : 'Sales dashboard', icon: LayoutDashboard },
    { id: 'settings' as const, label: language === 'th' ? 'ศูนย์ตั้งราคา' : 'Pricing control center', icon: Settings2 },
    { id: 'packages' as const, label: language === 'th' ? 'โปรแกรมทัวร์' : t('packages'), icon: PackageOpen },
    { id: 'company' as const, label: language === 'th' ? 'บริษัท & เอกสาร' : 'Company & documents', icon: Building2 },
    { id: 'users' as const, label: language === 'th' ? 'ผู้ใช้งาน' : t('users'), icon: Users },
  ];
  const active = nav.find((item) => item.id === page) || nav[0];

  function openPage(next: AdminPage, mode: 'push' | 'replace' = 'push') {
    setPage(next);
    if (!embedded || typeof window === 'undefined') return;
    const target = ADMIN_PAGE_PATHS[next];
    if (window.location.pathname === target) return;
    window.history[mode === 'replace' ? 'replaceState' : 'pushState']({ workspace: 'admin', adminPage: next }, '', target);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { workspace: 'admin', adminPage: next } }));
  }

  React.useEffect(() => {
    if (masterPage) setPage(masterPage);
  }, [masterPage]);

  React.useEffect(() => {
    if (!embedded || masterPage) return;
    function handlePopState() {
      if (!window.location.pathname.startsWith('/admin/settings') && !window.location.pathname.startsWith('/admin/packages') && !window.location.pathname.startsWith('/admin/pricing-settings') && !window.location.pathname.startsWith('/admin/company') && !window.location.pathname.startsWith('/admin/users') && !window.location.pathname.startsWith('/admin/reports')) return;
      setPage(adminPageFromPath(window.location.pathname));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [embedded, masterPage]);

  const syncActions = (
    <>
      <LanguageSwitch compact />
      <button type="button" className="ghost-button" onClick={onRefresh}><RefreshCw />{t('syncNow')}</button>
    </>
  );

  const content = (
    <>
      {page === 'dashboard' && <SalesDashboard trackings={trackings} invoices={invoices} payments={payments} onOpenTracking={onOpenTracking} embedded={embedded} headerActions={embedded ? syncActions : undefined} />}
      {page === 'packages' && <PackagesManager items={packages} onSave={onSavePackage} onDelete={onDeletePackage} headerActions={embedded ? syncActions : undefined} detailId={detailId} onNavigate={onNavigate} />}
      {page === 'settings' && <PricingControlCenter initial={settings} onSave={onSaveSettings} embedded={embedded} headerActions={embedded ? syncActions : undefined} />}
      {page === 'company' && <CompanySettingsManager initial={settings} onSave={onSaveSettings} onUploadLogo={onUploadLogo} onResetLogo={onResetLogo} embedded={embedded} headerActions={embedded ? syncActions : undefined} />}
      {page === 'users' && <UsersManager items={users} currentUser={currentUser} mode={mode} onCreate={onCreateUser} onSave={onSaveUser} onDelete={onDeleteUser} headerActions={embedded ? syncActions : undefined} detailId={detailId} onNavigate={onNavigate} />}
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-shell">
      <main className="admin-main admin-main--single-nav">
        <header className="admin-header admin-header--single-nav">
          <div className="admin-header-title"><div><span>BACK OFFICE</span><h1>{active.label}</h1></div></div>
          <div className="admin-header-actions"><LanguageSwitch compact /><button type="button" className="ghost-button" onClick={onRefresh}><RefreshCw />{t('syncNow')}</button><span className="admin-user"><i>{currentUser.name?.[0]?.toUpperCase()}</i><b>{currentUser.name}</b></span></div>
        </header>
        <div className="admin-content admin-content--single-nav">{content}</div>
      </main>
    </div>
  );
}

function PackagesManager({ items, onSave, onDelete, headerActions, detailId, onNavigate }: {
  items: TourPackage[];
  onSave: (pkg: TourPackage) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  headerActions?: React.ReactNode;
  detailId?: string;
  onNavigate?: (path: string) => void;
}) {
  const { t, language } = useI18n();
  const listPath = '/admin/packages';
  const go = (path: string) => onNavigate?.(path);
  async function remove(item: TourPackage) { if (window.confirm(t('confirmDelete'))) await onDelete(item.id); }
  const sourceTitle = language === 'th' ? 'LAND Rate · 2 pax / คน / คืน' : 'LAND Rate · 2 pax / person / night';

  if (detailId) {
    const isNew = detailId === 'new';
    const existing = isNew ? null : items.find((pkg) => pkg.id === detailId);
    if (isNew || existing) {
      return (
        <PackageDetailPage
          pkg={existing ?? newPackage()}
          isNew={isNew}
          onBack={() => go(listPath)}
          onSave={async (pkg) => { await onSave(pkg); go(listPath); }}
        />
      );
    }
  }

  return (
    <ListPage
      title={t('packages')}
      subtitle={sourceTitle}
      headerActions={headerActions}
      rows={items}
      getRowId={(pkg) => pkg.id}
      searchPlaceholder={language === 'th' ? 'ค้นหาชื่อโปรแกรม...' : 'Search packages...'}
      searchKeys={['name', (pkg) => String(pkg.nights)]}
      onRowClick={(pkg) => go(`${listPath}/${pkg.id}`)}
      onCreate={() => go(`${listPath}/new`)}
      createLabel={t('addPackage')}
      emptyLabel={t('noData')}
      columns={[
        { key: 'name', header: t('packageName'), render: (pkg) => <strong>{pkg.name}</strong> },
        { key: 'nights', header: t('durationNights'), render: (pkg) => `${pkg.nights} ${t('nights')}` },
        { key: 'rates', header: sourceTitle, render: (pkg) => {
          const rates = normalizePackageHotelRates(pkg);
          return <span className="rate-preview single-supplement-preview"><b>3★ ${formatNumber(rates.star3.pax2USD, 0)}</b><b>4★ ${formatNumber(rates.star4.pax2USD, 0)}</b><b>5★ ${formatNumber(rates.star5.pax2USD, 0)}</b></span>;
        }},
        { key: 'actions', header: '', className: 'bo-row-actions', render: (pkg) => (
          <div className="bo-row-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bo-icon-btn" title={t('edit')} aria-label={t('edit')} onClick={() => go(`${listPath}/${pkg.id}`)}><Pencil /></button>
            <button type="button" className="bo-icon-btn danger" title={t('delete')} aria-label={t('delete')} onClick={() => void remove(pkg)}><Trash2 /></button>
          </div>
        )},
      ]}
    />
  );
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

function normalizePackageHotelRates(pkg: TourPackage) {
  const fallback = pkg.rates || { pax1USD: 0, pax2USD: 0, pax3PlusUSD: 0 };
  return {
    star3: { ...(pkg.hotelRates?.star3 || fallback) },
    star4: { ...(pkg.hotelRates?.star4 || fallback) },
    star5: { ...(pkg.hotelRates?.star5 || fallback) },
  };
}

function PackageDetailPage({ pkg, isNew, onBack, onSave }: { pkg: TourPackage; isNew: boolean; onBack: () => void; onSave: (pkg: TourPackage) => Promise<void> }) {
  const { t, language } = useI18n();
  const th = language === 'th';
  const [form, setForm] = useState(() => ({
    ...pkg,
    hotelRates: normalizePackageHotelRates(pkg),
    singleSupplementsTHB: pkg.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 },
  }));
  const [busy, setBusy] = useState(false);
  const setSingle = (key: 'star3' | 'star4' | 'star5', value: number) => setForm({
    ...form,
    singleSupplementsTHB: { ...(form.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 }), [key]: Math.max(0, value) },
  });
  const single = form.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 };
  const hotelRates = normalizePackageHotelRates(form);
  const setLandRate = (star: 'star3' | 'star4' | 'star5', key: 'pax1USD' | 'pax2USD' | 'pax3PlusUSD', value: number) => {
    const nextHotelRates = { ...hotelRates, [star]: { ...hotelRates[star], [key]: Math.max(0, value) } };
    setForm({ ...form, hotelRates: nextHotelRates, rates: star === 'star3' ? nextHotelRates.star3 : form.rates });
  };
  async function submit() {
    if (!form.name.trim() || form.nights < 1 || busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }
  return (
    <div className="module-detail-page bo-detail-page has-form-actions">
      <PageHeader
        breadcrumb={[{ label: t('packages'), onClick: onBack }]}
        title={isNew ? (th ? 'เพิ่มโปรแกรมทัวร์' : 'Add tour package') : (form.name.trim() || t('packages'))}
        subtitle={isNew ? (th ? 'กำหนดชื่อ ระยะเวลา และ LAND Rate' : 'Set name, duration and LAND rates') : `${form.nights} ${t('nights')}`}
        onBack={onBack}
      />
      <div className="admin-stack">
        <SectionCard title={th ? 'ข้อมูลโปรแกรม' : 'Package details'}>
          <div className="editor-form package-editor-form">
            <label className="field"><span>{t('packageName')}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>{t('durationNights')}</span><input type="number" min="1" value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })} /></label>
          </div>
        </SectionCard>
        <SectionCard title={<><CircleDollarSign size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{th ? 'LAND Rate ที่ใช้ในเครื่องคำนวณ' : 'LAND rates used by calculator'}</>}>
          <p className="bo-page-subtitle">{th ? 'USD / คน / คืน · ค่านี้คือ Source of Truth ของราคาภาคพื้นในหน้าคำนวณ' : 'USD / person / night · These values are the calculator source of truth.'}</p>
          <div className="package-land-grid">
            {(['star3', 'star4', 'star5'] as const).map((star, index) => (
              <div className="package-land-tier" key={star}><strong>{index + 3} Stars</strong><RateFields rates={hotelRates[star]} setRate={(key, value) => setLandRate(star, key, value)} /></div>
            ))}
          </div>
          <div className="info-banner"><CheckCircle2 /><span>{th ? 'การแก้ราคาตรงนี้จะมีผลกับการคำนวณใหม่ทันที แต่ใบเสนอราคาเดิมจะคงราคา Snapshot เดิมไว้' : 'Changes apply to new calculations immediately; existing quotations keep their saved snapshot.'}</span></div>
        </SectionCard>
        <SectionCard title={<><HotelIcon size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{th ? 'ส่วนต่างพักเดี่ยว' : 'Single-room supplement'}</>}>
          <p className="bo-page-subtitle">{th ? 'กำหนดราคาเพิ่มต่อผู้พักเดี่ยว 1 ท่าน สำหรับแพ็กเกจนี้ทั้งทริป' : 'Set the extra charge per single-room traveller for the entire package.'}</p>
          <div className="single-supplement-fields">
            <NumberField label="3 Stars" value={single.star3} onChange={(v) => setSingle('star3', v)} suffix="THB / pax" />
            <NumberField label="4 Stars" value={single.star4} onChange={(v) => setSingle('star4', v)} suffix="THB / pax" />
            <NumberField label="5 Stars" value={single.star5} onChange={(v) => setSingle('star5', v)} suffix="THB / pax" />
          </div>
          <div className="info-banner"><HotelIcon /><span>{th ? 'หน้าคำนวณสามารถเลือกผู้พักเดี่ยวได้หลายท่าน และแก้ราคาเฉพาะเคสได้ โดยไม่เปลี่ยนราคาตั้งต้นนี้' : 'The calculator supports multiple single rooms and allows a case-specific override without changing this default.'}</span></div>
        </SectionCard>
      </div>
      <FormActionBar>
        <button type="button" className="ghost-button" disabled={busy} onClick={onBack}><X />{t('cancel')}</button>
        <button type="button" className="primary-button" disabled={busy || !form.name.trim() || form.nights < 1} onClick={() => void submit()}><Save />{t('save')}</button>
      </FormActionBar>
    </div>
  );
}

function RateFields({ rates, setRate }: { rates: { pax1USD: number; pax2USD: number; pax3PlusUSD: number }; setRate: (key: 'pax1USD' | 'pax2USD' | 'pax3PlusUSD', value: number) => void }) {
  const { t } = useI18n();
  return <div className="rate-fields"><label className="field"><span>{t('rate1')} · USD</span><input type="number" min="0" value={rates.pax1USD} onChange={(e) => setRate('pax1USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate2')} · USD</span><input type="number" min="0" value={rates.pax2USD} onChange={(e) => setRate('pax2USD', Number(e.target.value))}/></label><label className="field"><span>{t('rate3')} · USD</span><input type="number" min="0" value={rates.pax3PlusUSD} onChange={(e) => setRate('pax3PlusUSD', Number(e.target.value))}/></label></div>;
}

function PricingControlCenter({ initial, onSave, embedded = false, headerActions }: { initial: GlobalSettings; onSave: (settings: GlobalSettings) => Promise<void>; embedded?: boolean; headerActions?: React.ReactNode }) {
  const { t, language } = useI18n();
  const [form, setForm] = useState(initial);
  React.useEffect(() => setForm(initial), [initial]);
  const change = (key: keyof GlobalSettings, value: number) => setForm((current) => ({ ...current, [key]: value }));
  const discount = form.ticketPriceTHB > 0 ? ((form.ticketPriceTHB - (form.agentTicketPriceTHB ?? 0)) / form.ticketPriceTHB) * 100 : 0;

  const body = <div className="admin-stack pricing-control-center">

    <section className="pricing-source-banner">
      <div><span><CheckCircle2/></span><div><small>SOURCE OF TRUTH</small><h3>{language === 'th' ? 'สูตรคำนวณใช้ข้อมูล 2 ชุดนี้เท่านั้น' : 'Calculator uses only these 2 pricing sources'}</h3><p>{language === 'th' ? '1) ราคากลางจาก app_settings เช่น ตั๋ว ภาษี วีซ่า เรท และ Margin · 2) LAND Rate จากแต่ละโปรแกรมทัวร์ใน tour_packages.hotel_rates' : '1) Global app_settings for flight, tax, visa, FX and margin · 2) package LAND rates in tour_packages.hotel_rates.'}</p></div></div>
      <div className="pricing-source-warning"><b>{language === 'th' ? 'ไม่ใช้ในการคำนวณ' : 'Not used by calculator'}</b><span>{language === 'th' ? 'ตาราง hotels และค่า Legacy Hotel Defaults เดิมถูกเก็บไว้เพื่อความปลอดภัย แต่ไม่แสดงเป็นเมนูตั้งราคาแล้ว' : 'The hotels table and legacy hotel defaults remain untouched for safety but are no longer shown as calculator controls.'}</span></div>
    </section>

    <div className="pricing-global-section">
      <div className="pricing-section-heading"><div><span>GLOBAL PRICING</span><h2>{language === 'th' ? 'ราคากลางที่ใช้ทุกโปรแกรม' : 'Global pricing used by every package'}</h2><p>{language === 'th' ? 'บันทึกหนึ่งครั้ง การคำนวณใหม่จะอ่านค่าชุดนี้ทันที' : 'Save once and all new calculations read these values.'}</p></div><button type="button" className="primary-button" onClick={() => onSave(form)}><Save />{language === 'th' ? 'บันทึกราคากลาง' : 'Save global pricing'}</button></div>
      <SectionCard title={<><Plane size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{t('flightPricing')}</>}>
        <div className="bo-settings-list">
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('retailFlight')}</strong><span>THB / person</span></div><div className="bo-settings-row-control"><NumberField label={t('retailFlight')} value={form.ticketPriceTHB} onChange={(v) => change('ticketPriceTHB', v)} /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('agentFlight')}</strong></div><div className="bo-settings-row-control"><NumberField label={t('agentFlight')} value={form.agentTicketPriceTHB ?? 25220} onChange={(v) => change('agentTicketPriceTHB', v)} /></div></div>
          <div className="bo-settings-row-hint"><BadgePercent size={14} /> {t('agentDiscount')}: <b>{formatNumber(discount, 2)}%</b></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('airportTaxLabel')}</strong></div><div className="bo-settings-row-control"><NumberField label={t('airportTaxLabel')} value={form.airportTaxTHB} onChange={(v) => change('airportTaxTHB', v)} /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{language === 'th' ? 'ส่วนเพิ่ม Business Class / ท่าน' : 'Business Class surcharge / pax'}</strong></div><div className="bo-settings-row-control"><NumberField label={language === 'th' ? 'ส่วนเพิ่ม Business Class / ท่าน' : 'Business Class surcharge / pax'} value={form.businessUpgradeTHB ?? 15000} onChange={(v) => change('businessUpgradeTHB', v)} /></div></div>
        </div>
      </SectionCard>
      <SectionCard title={<><CircleDollarSign size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{language === 'th' ? 'อัตราแลกเปลี่ยน & Visa' : 'Exchange & Visa'}</>}>
        <div className="bo-settings-list">
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('usdRate')}</strong><span>THB / USD</span></div><div className="bo-settings-row-control"><NumberField label={t('usdRate')} value={form.exchangeRateUSD} onChange={(v) => change('exchangeRateUSD', v)} step="0.01" suffix="THB / USD" /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('visaFee')}</strong><span>USD / pax</span></div><div className="bo-settings-row-control"><NumberField label={t('visaFee')} value={form.visaFeeUSD} onChange={(v) => change('visaFeeUSD', v)} suffix="USD / pax" /></div></div>
        </div>
      </SectionCard>
      <SectionCard title={<><BadgePercent size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{t('margins')}</>}>
        <div className="bo-settings-list">
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('retailMargin')}</strong><span>THB / person</span></div><div className="bo-settings-row-control"><NumberField label={t('retailMargin')} value={form.marginTHB} onChange={(v) => change('marginTHB', v)} /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('agentMargin')}</strong></div><div className="bo-settings-row-control"><NumberField label={t('agentMargin')} value={form.agentMarginTHB ?? 3000} onChange={(v) => change('agentMarginTHB', v)} /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{language === 'th' ? 'Margin โรงแรม 5 ดาว / ท่าน' : '5-star hotel margin / pax'}</strong></div><div className="bo-settings-row-control"><NumberField label={language === 'th' ? 'Margin โรงแรม 5 ดาว / ท่าน' : '5-star hotel margin / pax'} value={form.hotel5StarMarginTHB ?? 10000} onChange={(v) => change('hotel5StarMarginTHB', v)} /></div></div>
          <div className="bo-settings-row-hint"><HotelIcon size={14} /> {language === 'th' ? 'เมื่อเลือก 5 Stars ระบบจะใช้ Margin นี้แทน Margin ปกติทั้ง Retail และ Agent' : 'When 5 Stars is selected, this margin overrides the normal Retail/Agent margin.'}</div>
        </div>
      </SectionCard>
      <SectionCard title={<><Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{t('groupDiscountSettings')}</>}>
        <div className="bo-settings-list">
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('groupDiscountMinPax')}</strong><span>{t('groupDiscountHint')}</span></div><div className="bo-settings-row-control"><NumberField label={t('groupDiscountMinPax')} value={form.groupDiscountMinPax ?? 10} onChange={(v) => change('groupDiscountMinPax', Math.max(1, Math.round(v)))} min={1} suffix={t('people')} /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{t('groupDiscountPercent')}</strong></div><div className="bo-settings-row-control"><NumberField label={t('groupDiscountPercent')} value={form.groupDiscountPercent ?? 10} onChange={(v) => change('groupDiscountPercent', Math.min(100, Math.max(0, v)))} step="0.01" min={0} max={100} suffix="%" /></div></div>
        </div>
      </SectionCard>
    </div>

    <section className="pricing-snapshot-note pricing-land-link-note">
      <PackageOpen/><div><strong>{language === 'th' ? 'LAND Rate แก้ที่หน้าโปรแกรมทัวร์' : 'Edit LAND rates on the Packages page'}</strong><span>{language === 'th' ? 'USD / คน / คืน · 3★, 4★, 5★ แก้ได้ใน Packages เท่านั้น เพื่อไม่ให้ซ้ำกับหน้านี้' : 'USD / person / night by tier — edit in Packages only to avoid duplicate controls.'}</span><a href="/admin/packages">{language === 'th' ? 'ไปหน้าโปรแกรมทัวร์ →' : 'Go to Packages →'}</a></div>
    </section>

    <section className="pricing-snapshot-note"><ShieldCheck/><div><strong>{language === 'th' ? 'ใบเสนอราคาเดิมจะไม่เปลี่ยนย้อนหลัง' : 'Existing quotations stay unchanged'}</strong><span>{language === 'th' ? 'Quotation เก็บ Snapshot ตอนออกเอกสารไว้ การแก้ราคาที่นี่มีผลกับการคำนวณ/Quotation ใหม่เท่านั้น จึงไม่กระทบเอกสารที่ลูกค้าได้รับไปแล้ว' : 'Quotation records keep a saved pricing snapshot. Changes here affect new calculations and new quotations only.'}</span></div></section>
  </div>;

  if (embedded) {
    return (
      <div className="module-list-page bo-list-page">
        <PageHeader
          title={language === 'th' ? 'ศูนย์ตั้งราคา' : 'Pricing control center'}
          subtitle={language === 'th' ? 'แก้ราคาที่เครื่องคำนวณใช้งานจริงจากจุดเดียว' : 'Edit the real calculator pricing sources in one place'}
          actions={headerActions}
        />
        {body}
      </div>
    );
  }

  return (
    <>
      <PageAction title={language === 'th' ? 'ศูนย์ตั้งราคา' : 'Pricing control center'} detail={language === 'th' ? 'แก้ราคาที่เครื่องคำนวณใช้งานจริงจากจุดเดียว' : 'Edit the real calculator pricing sources in one place'} />
      {body}
    </>
  );
}

type CompanySettingsTab = 'brand' | 'banks' | 'tax';

function CompanySettingsManager({ initial, onSave, onUploadLogo, onResetLogo, embedded = false, headerActions }: { initial: GlobalSettings; onSave: (settings: GlobalSettings) => Promise<void>; onUploadLogo: (file: File) => Promise<string>; onResetLogo: () => Promise<void>; embedded?: boolean; headerActions?: React.ReactNode }) {
  const { language } = useI18n();
  const th = language === 'th';
  const [tab, setTab] = useState<CompanySettingsTab>('brand');
  const [form, setForm] = useState(initial);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  React.useEffect(() => setForm(initial), [initial]);
  const change = (key: keyof GlobalSettings, value: number) => setForm((current) => ({ ...current, [key]: value }));
  const changeText = (key: keyof GlobalSettings, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function chooseLogo(file?: File) {
    if (!file || logoBusy) return;
    setLogoError('');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setLogoError(th ? 'รองรับเฉพาะ PNG, JPG หรือ WEBP' : 'Only PNG, JPG or WEBP files are supported.'); return; }
    if (file.size > 2 * 1024 * 1024) { setLogoError(th ? 'ไฟล์โลโก้ต้องมีขนาดไม่เกิน 2 MB' : 'Logo file must be 2 MB or smaller.'); return; }
    setLogoBusy(true);
    try { const url = await onUploadLogo(file); setForm((current) => ({ ...current, logoUrl: url })); }
    catch (error: any) { setLogoError(error?.message || (th ? 'อัปโหลดโลโก้ไม่สำเร็จ' : 'Logo upload failed.')); }
    finally { setLogoBusy(false); if (logoInputRef.current) logoInputRef.current.value = ''; }
  }
  async function resetBrand() { setLogoBusy(true); try { await onResetLogo(); setForm((current) => ({ ...current, logoUrl: '' })); } finally { setLogoBusy(false); } }
  const tabs: { id: CompanySettingsTab; label: string }[] = [
    { id: 'brand', label: th ? 'แบรนด์' : 'Brand' },
    { id: 'banks', label: th ? 'บัญชีรับเงิน' : 'Payment accounts' },
    { id: 'tax', label: th ? 'ภาษีและค่าบริการเอเจนต์' : 'VAT & agent fees' },
  ];
  const body = <div className="admin-stack company-settings-page">
    <div className="company-settings-tabs">{tabs.map((item) => <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    {tab === 'brand' && <SectionCard title={<><Settings2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{th ? 'โลโก้บริษัท' : 'Company logo'}</>}>
      <div className="bo-settings-list">
        <div className="bo-settings-row">
          <div className="bo-settings-row-label"><strong>{th ? 'ตัวอย่างโลโก้' : 'Logo preview'}</strong><span>{th ? 'ใช้กับเว็บไซต์ ใบเสนอราคา และ Invoice' : 'Used on website, quotations and invoices.'}</span></div>
          <div className="bo-settings-row-control"><div className="branding-preview-canvas"><Brand logoUrl={form.logoUrl} /></div></div>
        </div>
        <div className="bo-settings-row">
          <div className="bo-settings-row-label"><strong>{th ? 'จัดการไฟล์' : 'Manage file'}</strong></div>
          <div className="bo-settings-row-control">
            <input ref={logoInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseLogo(event.target.files?.[0])} />
            <div className="branding-button-row"><button type="button" className="primary-button" disabled={logoBusy} onClick={() => logoInputRef.current?.click()}><Plus />{th ? 'อัปเดตโลโก้' : 'Update logo'}</button><button type="button" className="ghost-button" disabled={logoBusy || !form.logoUrl} onClick={resetBrand}><RefreshCw />{th ? 'ใช้โลโก้เริ่มต้น' : 'Use default logo'}</button></div>
            {logoError && <div className="upload-inline-error" role="alert">{logoError}</div>}
          </div>
        </div>
      </div>
    </SectionCard>}
    {tab === 'banks' && <SectionCard title={<><Building2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{th ? 'บัญชีรับชำระใน Invoice' : 'Invoice payment accounts'}</>}>
      <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>{th ? 'บัญชี' : 'Account'}</th><th>{th ? 'ธนาคาร' : 'Bank'}</th><th>{th ? 'ชื่อบัญชี' : 'Account name'}</th><th>{th ? 'เลขที่บัญชี' : 'Account number'}</th></tr></thead><tbody>
        <PaymentAccountTableRow language={language} title={th ? 'บัญชีบริษัท · Invoice 1' : 'Company · Invoice 1'} bankName={form.companyBankName ?? 'ธนาคารกสิกรไทย'} accountName={form.companyAccountName ?? 'บริษัท OMG Experience Co., Ltd.'} accountNumber={form.companyAccountNumber ?? '051-2-51692-0'} onBankName={(v) => changeText('companyBankName', v)} onAccountName={(v) => changeText('companyAccountName', v)} onAccountNumber={(v) => changeText('companyAccountNumber', v)} />
        <PaymentAccountTableRow language={language} title={th ? 'บัญชีเจ้านาย · Invoice 2' : 'Owner · Invoice 2'} bankName={form.ownerBankName ?? 'ธนาคารไทยพาณิชย์'} accountName={form.ownerAccountName ?? 'นายศิเวก สัจเดว'} accountNumber={form.ownerAccountNumber ?? '203-215366-9'} onBankName={(v) => changeText('ownerBankName', v)} onAccountName={(v) => changeText('ownerAccountName', v)} onAccountNumber={(v) => changeText('ownerAccountNumber', v)} />
      </tbody></table></div>
    </SectionCard>}
    {tab === 'tax' && <>
      <SectionCard title={th ? 'VAT' : 'VAT'}>
        <div className="bo-settings-list"><div className="bo-settings-row"><div className="bo-settings-row-label"><strong>{th ? 'VAT สำหรับ Invoice 2' : 'VAT rate for Invoice 2'}</strong><span>{th ? 'เมื่อขอใบกำกับภาษี' : 'Tax invoice rate'}</span></div><div className="bo-settings-row-control"><NumberField label={th ? 'VAT สำหรับ Invoice 2 ที่ขอใบกำกับภาษี' : 'VAT rate for Invoice 2 tax invoice'} value={form.vatRatePercent ?? 7} onChange={(v) => change('vatRatePercent', Math.min(100, Math.max(0, v)))} step="0.01" suffix="%" /></div></div></div>
      </SectionCard>
      <SectionCard title={<><ReceiptText size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: -2 }} />{th ? 'ค่าบริการ Agent (VAT)' : 'Agent service fee (VAT)'}</>}>
        <div className="bo-settings-list">
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>4 Days 3 Nights</strong></div><div className="bo-settings-row-control"><NumberField label="4 Days 3 Nights" value={form.agentServiceFee4D3NTHB ?? 1500} onChange={(v) => change('agentServiceFee4D3NTHB', v)} suffix="THB / pax" /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>5 Days 4 Nights</strong></div><div className="bo-settings-row-control"><NumberField label="5 Days 4 Nights" value={form.agentServiceFee5D4NTHB ?? 2000} onChange={(v) => change('agentServiceFee5D4NTHB', v)} suffix="THB / pax" /></div></div>
          <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>6 Days 5 Nights</strong></div><div className="bo-settings-row-control"><NumberField label="6 Days 5 Nights" value={form.agentServiceFee6D5NTHB ?? 2500} onChange={(v) => change('agentServiceFee6D5NTHB', v)} suffix="THB / pax" /></div></div>
        </div>
      </SectionCard>
    </>}
    <button className="primary-button save-settings-button" onClick={() => onSave(form)}><Save/>{th ? 'บันทึกข้อมูลบริษัท & เอกสาร' : 'Save company & document settings'}</button>
  </div>;

  if (embedded) {
    return (
      <div className="module-list-page bo-list-page">
        <PageHeader
          title={th ? 'บริษัท & เอกสาร' : 'Company & documents'}
          subtitle={th ? 'โลโก้ · บัญชีรับชำระ · VAT' : 'Logo · payment accounts · VAT'}
          actions={headerActions}
        />
        {body}
      </div>
    );
  }

  return (
    <>
      <PageAction title={th ? 'บริษัท & เอกสาร' : 'Company & documents'} detail={th ? 'โลโก้ · บัญชีรับชำระ · VAT' : 'Logo · payment accounts · VAT'} />
      {body}
    </>
  );
}

function PaymentAccountTableRow({ title, bankName, accountName, accountNumber, onBankName, onAccountName, onAccountNumber }: { language: 'th' | 'en'; title: string; bankName: string; accountName: string; accountNumber: string; onBankName: (value: string) => void; onAccountName: (value: string) => void; onAccountNumber: (value: string) => void }) {
  return <tr><td><strong>{title}</strong></td><td><input value={bankName} onChange={(e) => onBankName(e.target.value)} /></td><td><input value={accountName} onChange={(e) => onAccountName(e.target.value)} /></td><td><input value={accountNumber} onChange={(e) => onAccountNumber(e.target.value)} className="mono" /></td></tr>;
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

function UsersManager({ items, currentUser, mode, onCreate, onSave, onDelete, headerActions, detailId, onNavigate }: {
  items: User[];
  currentUser: User;
  mode: 'supabase' | 'local';
  onCreate: (input: CreateSystemUserInput) => Promise<User>;
  onSave: (user: User) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  headerActions?: React.ReactNode;
  detailId?: string;
  onNavigate?: (path: string) => void;
}) {
  const { t, language } = useI18n();
  const listPath = '/admin/users';
  const go = (path: string) => onNavigate?.(path);
  async function remove(item: User) {
    if (item.id !== currentUser.id && window.confirm(language === 'th' ? `ลบบัญชี ${item.email} ออกจากระบบใช่หรือไม่` : `Delete ${item.email} from the system?`)) await onDelete(item.id);
  }

  if (detailId === 'new') {
    return (
      <UserCreatePage
        existingEmails={items.map((item) => item.email)}
        mode={mode}
        onBack={() => go(listPath)}
        onCreate={onCreate}
        onDone={() => go(listPath)}
      />
    );
  }

  return (
    <ListPage
      title={t('users')}
      subtitle={language === 'th' ? `${items.length} บัญชี · สร้างบัญชี Supabase พร้อมรหัสผ่านชั่วคราว` : `${items.length} accounts · Create Supabase accounts with a temporary password`}
      headerActions={headerActions}
      prepend={(
        <>
          <div className="info-banner user-create-banner"><ShieldCheck/><span>{language === 'th' ? 'เพิ่มบัญชีจากหน้านี้ได้โดยตรง ไม่ต้องไปสร้างใน Supabase Authentication ก่อน' : 'Create accounts directly from this page; no manual Supabase Authentication step is required.'}</span></div>
          {mode === 'supabase' && <div className="user-security-note"><KeyRound/><span>{language === 'th' ? 'รหัสผ่านจะแสดงเพียงครั้งเดียวหลังสร้างบัญชี กรุณาคัดลอกและส่งให้พนักงานผ่านช่องทางที่ปลอดภัย' : 'The password is shown once after account creation. Copy it and share it securely.'}</span></div>}
        </>
      )}
      rows={items}
      getRowId={(user) => user.id}
      searchPlaceholder={language === 'th' ? 'ค้นหาชื่อหรืออีเมล...' : 'Search name or email...'}
      searchKeys={['name', 'email']}
      onCreate={() => go(`${listPath}/new`)}
      createLabel={language === 'th' ? 'เพิ่มผู้ใช้งาน' : 'Add user'}
      emptyLabel={language === 'th' ? 'ยังไม่มีผู้ใช้งาน' : 'No users yet'}
      columns={[
        { key: 'user', header: language === 'th' ? 'ผู้ใช้' : 'User', render: (user) => <span className="data-main"><b>{user.name}</b><small>{user.email}</small></span> },
        { key: 'role', header: language === 'th' ? 'สิทธิ์' : 'Role', render: (user) => <StatusBadge status={user.role === 'admin' ? 'confirmed' : 'sent'} label={user.role === 'admin' ? t('admin') : t('sales')} /> },
        { key: 'change', header: language === 'th' ? 'เปลี่ยนสิทธิ์' : 'Change role', render: (user) => (
          <select value={user.role} disabled={user.id === currentUser.id} onClick={(e) => e.stopPropagation()} onChange={(event) => void onSave({ ...user, role: event.target.value as User['role'] })}>
            <option value="admin">{t('admin')}</option><option value="sales">{t('sales')}</option>
          </select>
        )},
        { key: 'actions', header: '', className: 'bo-row-actions', render: (user) => (
          <div className="bo-row-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bo-icon-btn danger" disabled={user.id === currentUser.id} title={language === 'th' ? 'ลบบัญชี' : 'Delete account'} aria-label={language === 'th' ? 'ลบบัญชี' : 'Delete account'} onClick={() => void remove(user)}><Trash2 /></button>
          </div>
        )},
      ]}
    />
  );
}

function UserCreatePage({ existingEmails, mode, onBack, onCreate, onDone }: {
  existingEmails: string[];
  mode: 'supabase' | 'local';
  onBack: () => void;
  onCreate: (input: CreateSystemUserInput) => Promise<User>;
  onDone: () => void;
}) {
  const { t, language } = useI18n();
  const th = language === 'th';
  const [form, setForm] = useState<CreateSystemUserInput>({ name: '', email: '', password: generateTemporaryPassword(), role: 'sales' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ user: User; password: string } | null>(null);

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
    if (!form.name.trim()) return setError(th ? 'กรุณากรอกชื่อผู้ใช้งาน' : 'Enter the user name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(th ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email address.');
    if (existingEmails.some((item) => item.toLowerCase() === email)) return setError(th ? 'อีเมลนี้มีอยู่ในระบบแล้ว' : 'This email already exists.');
    if (form.password.length < 8) return setError(th ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must contain at least 8 characters.');
    setBusy(true);
    try {
      const password = form.password;
      const user = await onCreate({ ...form, name: form.name.trim(), email });
      setCreated({ user, password });
    } catch (err: any) {
      setError(err?.message || (th ? 'สร้างบัญชีไม่สำเร็จ' : 'Could not create the account.'));
    } finally { setBusy(false); }
  }

  return (
    <div className="module-detail-page bo-detail-page has-form-actions">
      <PageHeader
        breadcrumb={[{ label: t('users'), onClick: created ? onDone : onBack }]}
        title={created ? (th ? 'สร้างบัญชีเรียบร้อยแล้ว' : 'Account created') : (th ? 'เพิ่มผู้ใช้งานระบบ' : 'Add system user')}
        subtitle={created ? (th ? 'คัดลอกข้อมูลเข้าสู่ระบบก่อนออกจากหน้านี้' : 'Copy login details before leaving this page') : (th ? 'กำหนดชื่อ อีเมล สิทธิ์ และรหัสผ่านชั่วคราว' : 'Set name, email, role and temporary password')}
        onBack={created ? onDone : onBack}
      />
      {created ? (
        <SectionCard title={th ? 'ข้อมูลเข้าสู่ระบบ' : 'Login credentials'}>
          <div className="user-created-panel">
            <span className="user-created-icon"><CheckCircle2 /></span>
            <h3>{th ? 'บัญชีพร้อมใช้งานทันที' : 'The account is ready'}</h3>
            <p>{th ? 'คัดลอกข้อมูลด้านล่างและส่งให้ผู้ใช้งาน รหัสผ่านนี้จะไม่สามารถเรียกดูย้อนหลังจากระบบได้' : 'Copy the credentials below and share them securely. The password cannot be viewed again.'}</p>
            <div className="credential-box"><span><Mail /><small>Email</small><b>{created.user.email}</b></span><span><KeyRound /><small>{th ? 'รหัสผ่านชั่วคราว' : 'Temporary password'}</small><b>{created.password}</b></span></div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title={th ? 'สร้างบัญชีพนักงานใหม่' : 'Create a staff account'}>
          <div className="user-create-form">
            {mode === 'supabase' && <div className="user-security-note"><KeyRound /><span>{th ? 'รหัสผ่านจะแสดงเพียงครั้งเดียวหลังสร้างบัญชี' : 'The password is shown once after account creation.'}</span></div>}
            {error && <div className="form-error">{error}</div>}
            <label className="field"><span>{th ? 'ชื่อผู้ใช้งาน' : 'Name'}</span><input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={th ? 'เช่น Nattanachai' : 'e.g. Nattanachai'} /></label>
            <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@company.com" /></label>
            <label className="field"><span>{th ? 'สิทธิ์การใช้งาน' : 'Role'}</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as User['role'] }))}><option value="sales">Sales — {th ? 'คำนวณราคาและติดตามลูกค้า' : 'Pricing and customer tracking'}</option><option value="admin">Admin — {th ? 'จัดการข้อมูลและผู้ใช้งานทั้งหมด' : 'Full system management'}</option></select></label>
            <label className="field"><span>{th ? 'รหัสผ่านชั่วคราว' : 'Temporary password'}</span><div className="password-create-field"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button><button type="button" onClick={() => setForm((current) => ({ ...current, password: generateTemporaryPassword() }))}><WandSparkles /></button><button type="button" onClick={() => copy(form.password)}><Copy /></button></div><small className="field-help">{th ? 'อย่างน้อย 8 ตัวอักษร ปุ่มประกายดาวใช้สร้างรหัสใหม่' : 'At least 8 characters. Use the sparkle button to generate a new password.'}</small></label>
          </div>
        </SectionCard>
      )}
      <FormActionBar>
        {created ? (
          <>
            <button type="button" className="primary-button" onClick={() => copy(credentials)}><Copy />{th ? 'คัดลอกข้อมูลเข้าสู่ระบบ' : 'Copy login details'}</button>
            <button type="button" className="ghost-button" onClick={onDone}><Check />{th ? 'เสร็จสิ้น' : 'Done'}</button>
          </>
        ) : (
          <>
            <button type="button" className="ghost-button" disabled={busy} onClick={onBack}><X />{th ? 'ยกเลิก' : 'Cancel'}</button>
            <button type="button" className="primary-button" disabled={busy} onClick={() => void submit()}><UserPlus />{busy ? (th ? 'กำลังสร้างบัญชี...' : 'Creating...') : (th ? 'สร้างบัญชี' : 'Create account')}</button>
          </>
        )}
      </FormActionBar>
    </div>
  );
}

function PageAction({ title, detail, action, onAction }: { title: string; detail?: string; action?: string; onAction?: () => void }) {
  return <div className="page-action"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action && onAction && <button className="primary-button" onClick={onAction}><Plus/>{action}</button>}</div>;
}
