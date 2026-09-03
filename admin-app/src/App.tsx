import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { database } from './db/database';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from './lib/supabase';
import { CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, PaymentInvoice, PaymentTransaction, QuotationRecord, TourPackage, User } from './types';
import { Login } from './components/Login';
import { FrontOffice } from './components/FrontOffice';
import { Admin } from './components/Admin';
import { CustomerTrackingWorkspace } from './components/CustomerTracking';
import { ToastItem, ToastStack } from './components/Ui';
import { useI18n } from './i18n';
import { LOGO_CACHE_KEY } from './components/Brand';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { GrowthWorkspace } from './components/GrowthWorkspace';
import { UnifiedBackOfficeShell, Workspace } from './components/UnifiedBackOfficeShell';


const WORKSPACE_PATHS: Record<Workspace, string> = {
  dashboard: '/admin',
  front: '/admin/pricing',
  tracking: '/admin/customers',
  growth: '/admin/marketing',
  admin: '/admin/settings',
};

function workspaceFromPath(pathname: string): Workspace {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  if (path.startsWith('/admin/pricing')) return 'front';
  if (path.startsWith('/admin/customers')) return 'tracking';
  if (path.startsWith('/admin/marketing')) return 'growth';
  if (path.startsWith('/admin/settings')) return 'admin';
  return 'dashboard';
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
  const [workspace, setWorkspace] = useState<Workspace>(() => workspaceFromPath(typeof window !== 'undefined' ? window.location.pathname : '/admin'));
  const [currentPath, setCurrentPath] = useState(() => typeof window !== 'undefined' ? window.location.pathname : '/admin');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function notify(message: string, kind: ToastItem['kind'] = 'success') {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3600);
  }

  function navigateWorkspace(next: Workspace, targetPath?: string, historyMode: 'push' | 'replace' = 'push') {
    if (next === 'admin' && currentUser?.role !== 'admin') {
      next = 'dashboard';
      targetPath = WORKSPACE_PATHS.dashboard;
    }
    setWorkspace(next);
    if (typeof window === 'undefined') return;
    const target = targetPath || WORKSPACE_PATHS[next];
    if (window.location.pathname === target) {
      setCurrentPath(target);
      return;
    }
    const method = historyMode === 'replace' ? 'replaceState' : 'pushState';
    window.history[method]({ workspace: next }, '', target);
    setCurrentPath(target);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { workspace: next } }));
  }

  useEffect(() => {
    function handlePopState() {
      const next = workspaceFromPath(window.location.pathname);
      setCurrentPath(window.location.pathname);
      if (next === 'admin' && currentUser?.role !== 'admin') {
        setWorkspace('dashboard');
        setCurrentPath(WORKSPACE_PATHS.dashboard);
        window.history.replaceState({ workspace: 'dashboard' }, '', WORKSPACE_PATHS.dashboard);
        return;
      }
      setWorkspace(next);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser?.role]);


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
            const requested = workspaceFromPath(window.location.pathname);
            if (requested === 'admin' && sessionUser.role !== 'admin') {
              setWorkspace('dashboard');
              setCurrentPath(WORKSPACE_PATHS.dashboard);
              window.history.replaceState({ workspace: 'dashboard' }, '', WORKSPACE_PATHS.dashboard);
            } else {
              setWorkspace(requested);
              setCurrentPath(window.location.pathname);
              window.history.replaceState({ workspace: requested }, '', window.location.pathname);
            }
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
    const requested = workspaceFromPath(window.location.pathname);
    const allowed = requested === 'admin' && user.role !== 'admin' ? 'dashboard' : requested;
    const allowedPath = allowed === requested ? window.location.pathname : WORKSPACE_PATHS.dashboard;
    setWorkspace(allowed);
    setCurrentPath(allowedPath);
    window.history.replaceState({ workspace: allowed }, '', allowedPath);
  }

  async function logout() {
    await supabaseAuth.signOut();
    setCurrentUser(null);
    setWorkspace('dashboard');
    setCurrentPath('/admin');
    if (typeof window !== 'undefined') window.history.replaceState({}, '', '/admin');
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
  const saveTracking = async (value: CustomerTracking) => run(async () => { await database.saveTracking(value); setTrackings(await database.getTrackings()); });
  const saveQuotation = async (value: QuotationRecord) => run(async () => { await database.saveQuotation(value); setQuotations(await database.getQuotations()); }, 'บันทึกใบเสนอราคาเรียบร้อยแล้ว');
  const deleteQuotation = async (id: string) => run(async () => { await database.deleteQuotation(id); setQuotations(await database.getQuotations()); }, t('deleted'));
  const deleteTracking = async (id: string) => run(async () => { await database.deleteTracking(id); setTrackings(await database.getTrackings()); setInvoices(await database.getInvoices()); setPayments(await database.getPaymentTransactions()); }, t('deleted'));
  const saveInvoice = async (value: PaymentInvoice) => run(async () => { await database.saveInvoice(value); setInvoices(await database.getInvoices()); });
  const deleteInvoice = async (id: string) => run(async () => { await database.deleteInvoice(id); setInvoices(await database.getInvoices()); }, t('deleted'));
  const savePayment = async (value: PaymentTransaction) => run(async () => { await database.savePaymentTransaction(value); setPayments(await database.getPaymentTransactions()); });
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

  if (loading || (currentUser && !settings)) {
    return <div className="app-loading"><RefreshCw/><strong>{t('loading')}</strong><span>Bhutan Center Pricing</span></div>;
  }

  return <>
    {!currentUser && <Login users={users} onSuccess={loginSuccess}/>} 
    {currentUser && settings && <UnifiedBackOfficeShell currentUser={currentUser} settings={settings} workspace={workspace} currentPath={currentPath} onNavigate={(next, path) => navigateWorkspace(next, path)} onLogout={logout}>
      {workspace === 'dashboard' && <UnifiedDashboard currentUser={currentUser} trackings={trackings} quotations={quotations} onOpenPricing={() => navigateWorkspace('front')} onOpenTracking={() => navigateWorkspace('tracking')} onOpenGrowth={() => navigateWorkspace('growth')} onOpenAdmin={() => navigateWorkspace('admin')} onLogout={logout}/>} 
      {workspace === 'front' && <FrontOffice settings={settings} packages={packages} currentUser={currentUser} onSaveQuotation={saveQuotation} onOpenDashboard={() => navigateWorkspace('dashboard')} onOpenTracking={() => navigateWorkspace('tracking')} onOpenAdmin={() => navigateWorkspace('admin')} onLogout={logout}/>} 
      {workspace === 'tracking' && <CustomerTrackingWorkspace settings={settings} packages={packages} users={users} currentUser={currentUser} trackings={trackings} invoices={invoices} payments={payments} quotations={quotations} onSaveQuotation={saveQuotation} onDeleteQuotation={deleteQuotation} onBack={() => navigateWorkspace('dashboard')} onOpenAdmin={() => navigateWorkspace('admin')} onLogout={logout} onSaveTracking={saveTracking} onDeleteTracking={deleteTracking} onSaveInvoice={saveInvoice} onDeleteInvoice={deleteInvoice} onSavePayment={savePayment} onDeletePayment={deletePayment} onUploadPaymentSlip={uploadPaymentSlip} onGetPaymentSlipUrl={getPaymentSlipUrl} onDeletePaymentSlip={deletePaymentSlip}/>} 
      {workspace === 'admin' && currentUser.role === 'admin' && <Admin
        embedded settings={settings} hotels={hotels} packages={packages} users={users} trackings={trackings} invoices={invoices} payments={payments} currentUser={currentUser} mode={database.mode}
        onBack={() => navigateWorkspace('dashboard')} onOpenTracking={() => navigateWorkspace('tracking')} onLogout={logout} onRefresh={refresh}
        onSaveSettings={saveSettings} onUploadLogo={uploadLogo} onResetLogo={resetLogo} onSaveHotel={saveHotel} onDeleteHotel={deleteHotel}
        onSavePackage={savePackage} onDeletePackage={deletePackage} onCreateUser={createUser} onSaveUser={saveUser} onDeleteUser={deleteUser}
      />}
      {workspace === 'growth' && <GrowthWorkspace currentUser={currentUser} packages={packages} trackings={trackings} quotations={quotations} onBack={() => navigateWorkspace('dashboard')} onLogout={logout}/>}
    </UnifiedBackOfficeShell>}
    <ToastStack items={toasts} onDismiss={(id) => setToasts((list) => list.filter((item) => item.id !== id))}/>
  </>;
}
