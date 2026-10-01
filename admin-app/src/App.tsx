import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { database } from './db/database';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from './lib/supabase';
import { CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, PaymentInvoice, PaymentTransaction, QuotationRecord, TourPackage, User } from './types';
import { Login } from './components/Login';
import { ToastItem, ToastStack } from './components/Ui';
import { useI18n } from './i18n';
import { LOGO_CACHE_KEY } from './components/Brand';
import { UnifiedBackOfficeShell } from './components/UnifiedBackOfficeShell';
import { AppWorkspace } from './AppWorkspace';
import { parseRoute, resolveLegacyRedirect, Workspace } from './routes';

function workspaceFromRoute(pathname: string): Workspace {
  return parseRoute(pathname).workspace;
}

export default function App() {
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [trackings, setTrackings] = useState<CustomerTracking[]>([]);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [currentPath, setCurrentPath] = useState(() => typeof window !== 'undefined' ? window.location.pathname : '/admin');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const route = useMemo(() => parseRoute(currentPath), [currentPath]);
  const workspace = workspaceFromRoute(currentPath);

  function notify(message: string, kind: ToastItem['kind'] = 'success') {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3600);
  }

  function navigate(path: string, historyMode: 'push' | 'replace' = 'push') {
    if (typeof window === 'undefined') return;
    const redirect = resolveLegacyRedirect(path);
    const target = redirect || path;
    const method = historyMode === 'replace' ? 'replaceState' : 'pushState';
    if (window.location.pathname !== target) {
      window.history[method]({ path: target }, '', target);
    }
    setCurrentPath(target);
  }

  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      const redirect = resolveLegacyRedirect(path);
      if (redirect) {
        window.history.replaceState({ path: redirect }, '', redirect);
        setCurrentPath(redirect);
        return;
      }
      setCurrentPath(path);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const redirect = resolveLegacyRedirect(currentPath);
    if (redirect) navigate(redirect, 'replace');
  }, [currentPath]);

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [nextSettings, nextHotels, nextPackages, nextUsers, nextTrackings, nextInvoices, nextPayments, nextQuotations] = await Promise.all([
        database.getSettings(), database.getHotels().catch(() => []), database.getPackages(), database.getUsers(), database.getTrackings(), database.getInvoices(), database.getPaymentTransactions(), database.getQuotations(),
      ]);
      setSettings(nextSettings);
      setHotels(nextHotels);
      setPackages(nextPackages);
      setUsers(nextUsers);
      setTrackings(nextTrackings);
      setInvoices(nextInvoices);
      setPayments(nextPayments);
      setQuotations(nextQuotations);
    } catch (error: any) {
      notify(`${t('error')}: ${error?.message || 'Unknown error'}`, 'error');
    } finally { if (showLoading) setLoading(false); }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        if (isSupabaseConfigured) {
          const session = await supabaseAuth.getSession();
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            const sessionUser: User = {
              id: profile.id,
              name: profile.name || session.user.email?.split('@')[0] || 'User',
              email: profile.email || session.user.email || '',
              role: profile.role,
              createdAt: profile.created_at,
            };
            setCurrentUser(sessionUser);
            setCurrentPath(window.location.pathname);
            await loadData(false);
          }
        } else {
          await loadData(false);
        }
      } catch (error: any) {
        notify(error?.message || t('error'), 'error');
      } finally { setLoading(false); }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (settings.logoUrl) window.localStorage.setItem(LOGO_CACHE_KEY, settings.logoUrl);
    else window.localStorage.removeItem(LOGO_CACHE_KEY);
  }, [settings?.logoUrl]);

  async function loginSuccess(user: User) {
    setCurrentUser(user);
    if (!users.some((item) => item.id === user.id)) {
      try { await database.saveUser(user); } catch { /* profile already exists in most cases */ }
    }
    await loadData(false);
    navigate(window.location.pathname, 'replace');
  }

  async function logout() {
    await supabaseAuth.signOut();
    setCurrentUser(null);
    navigate('/admin', 'replace');
  }

  async function run(action: () => Promise<void>, success = t('saved')) {
    try { await action(); notify(success); }
    catch (error: any) { notify(`${t('error')}: ${error?.message || 'Unknown error'}`, 'error'); throw error; }
  }

  const refresh = async () => { await loadData(false); notify(t('refreshDone')); };
  const saveSettings = async (value: GlobalSettings) => run(async () => { await database.saveSettings(value); setSettings(await database.getSettings()); });
  const uploadLogo = async (file: File): Promise<string> => {
    try {
      if (!settings) throw new Error('ไม่พบข้อมูลการตั้งค่า');
      const url = await database.uploadBrandLogo(file);
      const next = { ...settings, logoUrl: url };
      await database.saveSettings(next);
      setSettings(next);
      window.localStorage.setItem(LOGO_CACHE_KEY, url);
      notify('อัปเดตโลโก้เรียบร้อยแล้ว');
      return url;
    } catch (error: any) {
      notify(`${t('error')}: ${error?.message || 'อัปโหลดโลโก้ไม่สำเร็จ'}`, 'error');
      throw error;
    }
  };
  const resetLogo = async (): Promise<void> => {
    try {
      if (!settings) return;
      await database.deleteBrandLogo();
      const next = { ...settings, logoUrl: '' };
      await database.saveSettings(next);
      setSettings(next);
      window.localStorage.removeItem(LOGO_CACHE_KEY);
      notify('เปลี่ยนกลับเป็นโลโก้เริ่มต้นแล้ว');
    } catch (error: any) {
      notify(`${t('error')}: ${error?.message || 'รีเซ็ตโลโก้ไม่สำเร็จ'}`, 'error');
      throw error;
    }
  };

  const saveHotel = async (value: Hotel) => run(async () => { await database.saveHotel(value); setHotels(await database.getHotels()); });
  const deleteHotel = async (id: string) => run(async () => { await database.deleteHotel(id); setHotels(await database.getHotels()); }, t('deleted'));
  const savePackage = async (value: TourPackage) => run(async () => { await database.savePackage(value); setPackages(await database.getPackages()); });
  const deletePackage = async (id: string) => run(async () => { await database.deletePackage(id); setPackages(await database.getPackages()); }, t('deleted'));
  const createUser = async (value: CreateSystemUserInput): Promise<User> => {
    let created!: User;
    await run(async () => { created = await database.createUser(value); setUsers(await database.getUsers()); }, 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
    return created;
  };
  const saveUser = async (value: User) => run(async () => { await database.saveUser(value); setUsers(await database.getUsers()); });
  const deleteUser = async (id: string) => run(async () => { await database.deleteUser(id); setUsers(await database.getUsers()); }, t('deleted'));
  const saveTracking = async (value: CustomerTracking) => run(async () => {
    const existing = trackings.find((item) => item.id === value.id);
    const bookingNo = value.bookingNo || existing?.bookingNo || await database.allocateDocNumber('BK');
    await database.saveTracking({ ...value, bookingNo });
    setTrackings(await database.getTrackings());
  });
  const saveQuotation = async (value: QuotationRecord) => run(async () => { await database.saveQuotation(value); setQuotations(await database.getQuotations()); }, 'บันทึกใบเสนอราคาเรียบร้อยแล้ว');
  const deleteQuotation = async (id: string) => run(async () => { await database.deleteQuotation(id); setQuotations(await database.getQuotations()); }, t('deleted'));
  const deleteTracking = async (id: string) => run(async () => { await database.deleteTracking(id); setTrackings(await database.getTrackings()); setInvoices(await database.getInvoices()); setPayments(await database.getPaymentTransactions()); }, t('deleted'));
  const saveInvoice = async (value: PaymentInvoice) => run(async () => { await database.saveInvoice(value); setInvoices(await database.getInvoices()); });
  const deleteInvoice = async (id: string) => run(async () => { await database.deleteInvoice(id); setInvoices(await database.getInvoices()); }, t('deleted'));
  const savePayment = async (value: PaymentTransaction) => run(async () => {
    const existing = payments.find((item) => item.id === value.id);
    const receiptNo = value.receiptNo || existing?.receiptNo || await database.allocateDocNumber('RC');
    await database.savePaymentTransaction({ ...value, receiptNo });
    setPayments(await database.getPaymentTransactions());
  });
  const deletePayment = async (id: string) => run(async () => { await database.deletePaymentTransaction(id); setPayments(await database.getPaymentTransactions()); }, t('deleted'));
  const uploadPaymentSlip = async (trackingId: string, paymentId: string, file: File) => {
    try { return await database.uploadPaymentSlip(trackingId, paymentId, file); }
    catch (error: any) { notify(`${t('error')}: ${error?.message || 'อัปโหลดสลิปไม่สำเร็จ'}`, 'error'); throw error; }
  };
  const getPaymentSlipUrl = async (path: string) => {
    try { return await database.getPaymentSlipUrl(path); }
    catch (error: any) { notify(`${t('error')}: ${error?.message || 'เปิดสลิปไม่สำเร็จ'}`, 'error'); throw error; }
  };
  const deletePaymentSlip = async (path: string) => {
    try { await database.deletePaymentSlip(path); }
    catch (error: any) { notify(`${t('error')}: ${error?.message || 'ลบสลิปไม่สำเร็จ'}`, 'error'); throw error; }
  };

  const masterModules = new Set(['packages', 'pricing-settings', 'agents', 'company', 'document-numbers', 'users', 'reports']);
  const blockedMaster = masterModules.has(route.module) && currentUser?.role !== 'admin';

  if (loading || (currentUser && !settings)) {
    return <div className="app-loading"><RefreshCw/><strong>{t('loading')}</strong><span>Bhutan Center Pricing</span></div>;
  }

  return <>
    {!currentUser && <Login users={users} onSuccess={loginSuccess}/>} 
    {currentUser && settings && <UnifiedBackOfficeShell currentUser={currentUser} settings={settings} workspace={workspace} currentPath={currentPath} onNavigate={navigate} onLogout={logout}>
      {blockedMaster ? (
        <div className="module-list-page"><p className="module-empty">Admin access required.</p></div>
      ) : (
        <AppWorkspace
          route={route}
          navigate={navigate}
          currentUser={currentUser}
          settings={settings}
          hotels={hotels}
          packages={packages}
          users={users}
          trackings={trackings}
          invoices={invoices}
          payments={payments}
          quotations={quotations}
          databaseMode={database.mode}
          onLogout={logout}
          onRefresh={refresh}
          onSaveSettings={saveSettings}
          onUploadLogo={uploadLogo}
          onResetLogo={resetLogo}
          onSaveHotel={saveHotel}
          onDeleteHotel={deleteHotel}
          onSavePackage={savePackage}
          onDeletePackage={deletePackage}
          onCreateUser={createUser}
          onSaveUser={saveUser}
          onDeleteUser={deleteUser}
          onSaveTracking={saveTracking}
          onDeleteTracking={deleteTracking}
          onSaveQuotation={saveQuotation}
          onDeleteQuotation={deleteQuotation}
          onSaveInvoice={saveInvoice}
          onDeleteInvoice={deleteInvoice}
          onSavePayment={savePayment}
          onDeletePayment={deletePayment}
          onUploadPaymentSlip={uploadPaymentSlip}
          onGetPaymentSlipUrl={getPaymentSlipUrl}
          onDeletePaymentSlip={deletePaymentSlip}
        />
      )}
    </UnifiedBackOfficeShell>}
    <ToastStack items={toasts} onDismiss={(id) => setToasts((list) => list.filter((item) => item.id !== id))}/>
  </>;
}
