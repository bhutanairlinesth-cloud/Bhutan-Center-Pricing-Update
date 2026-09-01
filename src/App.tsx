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
  const [workspace, setWorkspace] = useState<'dashboard' | 'front' | 'tracking' | 'admin' | 'growth'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function notify(message: string, kind: ToastItem['kind'] = 'success') {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3600);
  }

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [nextSettings, nextHotels, nextPackages, nextUsers, nextTrackings, nextInvoices, nextPayments, nextQuotations] = await Promise.all([
        database.getSettings(), database.getHotels(), database.getPackages(), database.getUsers(), database.getTrackings(), database.getInvoices(), database.getPaymentTransactions(), database.getQuotations(),
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
            setCurrentUser({
              id: profile.id,
              name: profile.name || session.user.email?.split('@')[0] || 'User',
              email: profile.email || session.user.email || '',
              role: profile.role,
              createdAt: profile.created_at,
            });
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
    setWorkspace('dashboard');
  }

  async function logout() {
    await supabaseAuth.signOut();
    setCurrentUser(null);
    setWorkspace('dashboard');
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
    {currentUser && settings && workspace === 'dashboard' && <UnifiedDashboard currentUser={currentUser} trackings={trackings} quotations={quotations} onOpenPricing={() => setWorkspace('front')} onOpenTracking={() => setWorkspace('tracking')} onOpenGrowth={() => setWorkspace('growth')} onOpenAdmin={() => setWorkspace('admin')} onLogout={logout}/>} 
    {currentUser && settings && workspace === 'front' && <FrontOffice settings={settings} packages={packages} currentUser={currentUser} onSaveQuotation={saveQuotation} onOpenDashboard={() => setWorkspace('dashboard')} onOpenTracking={() => setWorkspace('tracking')} onOpenAdmin={() => setWorkspace('admin')} onLogout={logout}/>} 
    {currentUser && settings && workspace === 'tracking' && <CustomerTrackingWorkspace settings={settings} packages={packages} users={users} currentUser={currentUser} trackings={trackings} invoices={invoices} payments={payments} quotations={quotations} onSaveQuotation={saveQuotation} onDeleteQuotation={deleteQuotation} onBack={() => setWorkspace('dashboard')} onOpenAdmin={() => setWorkspace('admin')} onLogout={logout} onSaveTracking={saveTracking} onDeleteTracking={deleteTracking} onSaveInvoice={saveInvoice} onDeleteInvoice={deleteInvoice} onSavePayment={savePayment} onDeletePayment={deletePayment} onUploadPaymentSlip={uploadPaymentSlip} onGetPaymentSlipUrl={getPaymentSlipUrl} onDeletePaymentSlip={deletePaymentSlip}/>} 
    {currentUser && settings && workspace === 'admin' && currentUser.role === 'admin' && <Admin
      settings={settings} hotels={hotels} packages={packages} users={users} trackings={trackings} invoices={invoices} payments={payments} currentUser={currentUser} mode={database.mode}
      onBack={() => setWorkspace('dashboard')} onOpenTracking={() => setWorkspace('tracking')} onLogout={logout} onRefresh={refresh}
      onSaveSettings={saveSettings} onUploadLogo={uploadLogo} onResetLogo={resetLogo} onSaveHotel={saveHotel} onDeleteHotel={deleteHotel}
      onSavePackage={savePackage} onDeletePackage={deletePackage} onCreateUser={createUser} onSaveUser={saveUser} onDeleteUser={deleteUser}
    />}
    {currentUser && settings && workspace === 'growth' && <GrowthWorkspace currentUser={currentUser} packages={packages} trackings={trackings} quotations={quotations} onBack={() => setWorkspace('dashboard')} onLogout={logout}/>}
    <ToastStack items={toasts} onDismiss={(id) => setToasts((list) => list.filter((item) => item.id !== id))}/>
  </>;
}
