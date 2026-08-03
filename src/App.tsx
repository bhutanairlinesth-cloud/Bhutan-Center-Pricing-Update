/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Plane, Map, CreditCard, Percent,
  Users as UsersIcon, LogOut, Menu, X, RefreshCw, Calculator,
  Database, ChevronRight, Bell, Search, Hotel as HotelIcon, BadgePercent, Sparkles, ArrowUpRight
} from 'lucide-react';
import { User, Hotel, TourPackage, GlobalSettings } from './types';
import { database } from './db/database';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { 
  ExchangeRateView, FlightSettingsView, HotelManagementView, 
  TourPackageView, VisaSettingsView, MarginSettingsView,
  UsersManagementView, DatabaseSchemaView, SalesQuotationView, 
  AdminDashboardOverview, useToast, ToastContainer 
} from './components/DashboardViews';
import { BhutanCenterLogo } from './components/BhutanCenterLogo';
import { LanguageSwitcher, useLanguage } from './i18n';

export default function App() {
  const { language } = useLanguage();
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Database States
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Navigation States
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Toasts
  const { toasts, showToast, setToasts } = useToast();

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Restore a Supabase session first. Shared pricing data is loaded only after authentication.
  useEffect(() => {
    const bootstrap = async () => {
      if (!isSupabaseConfigured) {
        await loadDatabase();
        return;
      }
      try {
        const session = await supabaseAuth.getSession();
        const authUser = session?.user;
        if (!authUser) {
          setIsLoadingData(false);
          return;
        }
        const profile = await fetchProfile(authUser.id);
        setCurrentUser({
          id: profile.id,
          name: profile.name || authUser.email?.split('@')[0] || 'User',
          email: profile.email || authUser.email || '',
          role: profile.role,
          createdAt: profile.created_at,
        });
        await loadDatabase();
      } catch (error) {
        console.error(error);
        setIsLoadingData(false);
      }
    };
    bootstrap();
  }, []);

  const loadDatabase = async () => {
    setIsLoadingData(true);
    try {
      const [nextSettings, nextHotels, nextPackages, nextUsers] = await Promise.all([
        database.getSettings(), database.getHotels(), database.getPackages(), database.getUsers()
      ]);
      setSettings(nextSettings);
      setHotels(nextHotels);
      setPackages(nextPackages);
      setUsers(nextUsers);
    } catch (error: any) {
      console.error(error);
      showToast(`โหลดข้อมูลไม่สำเร็จ: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- DATABASE WRITE / SYNCHRONIZATION HELPERS ---
  const persist = async (action: () => Promise<void>, success: string, refresh: () => Promise<any> | void) => {
    try {
      await action();
      await refresh();
      showToast(success);
    } catch (error: any) {
      console.error(error);
      showToast(`บันทึกไม่สำเร็จ: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleSaveSettings = (updated: GlobalSettings) => persist(
    () => database.saveSettings(updated),
    'บันทึกการตั้งค่าเรียบร้อยแล้ว',
    async () => setSettings(await database.getSettings())
  );

  const handleAddHotel = (hotel: Hotel) => persist(
    () => database.saveHotel(hotel), 'เพิ่มโรงแรมเรียบร้อยแล้ว',
    async () => setHotels(await database.getHotels())
  );

  const handleUpdateHotel = (hotel: Hotel) => persist(
    () => database.saveHotel(hotel), 'อัปเดตโรงแรมเรียบร้อยแล้ว',
    async () => setHotels(await database.getHotels())
  );

  const handleDeleteHotel = (id: string) => persist(
    () => database.deleteHotel(id), 'ลบโรงแรมเรียบร้อยแล้ว',
    async () => setHotels(await database.getHotels())
  );

  const handleAddPackage = (pkg: TourPackage) => persist(
    () => database.savePackage(pkg), 'เพิ่มโปรแกรมทัวร์เรียบร้อยแล้ว',
    async () => setPackages(await database.getPackages())
  );

  const handleUpdatePackage = (pkg: TourPackage) => persist(
    () => database.savePackage(pkg), 'อัปเดตโปรแกรมทัวร์เรียบร้อยแล้ว',
    async () => setPackages(await database.getPackages())
  );

  const handleDeletePackage = (id: string) => persist(
    () => database.deletePackage(id), 'ลบโปรแกรมทัวร์เรียบร้อยแล้ว',
    async () => setPackages(await database.getPackages())
  );

  const handleAddUser = (user: User) => persist(
    () => database.saveUser(user), 'เพิ่มข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
    async () => setUsers(await database.getUsers())
  );

  const handleUpdateUser = async (user: User) => {
    await persist(
      () => database.saveUser(user), 'อัปเดตผู้ใช้งานเรียบร้อยแล้ว',
      async () => setUsers(await database.getUsers())
    );
    if (currentUser?.id === user.id) setCurrentUser(user);
  };

  const handleDeleteUser = (id: string) => persist(
    () => database.deleteUser(id), 'ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
    async () => setUsers(await database.getUsers())
  );

  const handleResetSystem = () => {
    showToast(isSupabaseConfigured
      ? 'เพื่อความปลอดภัย การรีเซ็ตฐานข้อมูล Supabase ต้องทำผ่าน SQL Editor'
      : 'โหมด Local: กรุณาล้าง Site Data เพื่อรีเซ็ตข้อมูล');
  };

  // Handle Logout
  const handleLogout = async () => {
    if (isSupabaseConfigured) await supabaseAuth.signOut();
    setCurrentUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Ensure database loads before rendering
  if (isLoadingData || (currentUser && !settings)) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-brand-emerald mx-auto" />
          <p className="text-sm font-semibold text-gray-500 font-display">
            Initializing Bhutan Center Databases...
          </p>
        </div>
      </div>
    );
  }

  // Render Login Portal if not authenticated
  if (!currentUser) {
    return (
      <>
        <AuthScreen users={users} onLoginSuccess={async (u) => {
          // If the user doesn't exist in our user list, add them to mockDb
          if (!users.some(x => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase())) {
            await database.saveUser(u);
            setUsers(await database.getUsers());
          }
          setCurrentUser(u);
          await loadDatabase();
          // Auto route depending on role
          if (u.role === 'sales') {
            setActiveTab('sales-calc');
          } else {
            setActiveTab('dashboard');
          }
          showToast(`Welcome back, ${u.name}! Session established as [${u.role.toUpperCase()}]`);
        }} />
        <ToastContainer toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      </>
    );
  }

  const adminLinks = [
    { id: 'dashboard', label: 'Overview', sub: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'sales-calc', label: 'Pricing Desk', sub: 'คำนวณราคา', icon: Calculator },
    { id: 'packages', label: 'Tour Products', sub: 'โปรแกรมทัวร์', icon: Map },
    { id: 'hotels', label: 'Hotels', sub: 'โรงแรมและห้องพัก', icon: HotelIcon },
    { id: 'flight', label: 'Flight & Tax', sub: 'ตั๋วและภาษี', icon: Plane },
    { id: 'exchange-rate', label: 'Exchange', sub: 'อัตราแลกเปลี่ยน', icon: TrendingUp },
    { id: 'visa', label: 'Visa & Fees', sub: 'วีซ่าและค่าธรรมเนียม', icon: CreditCard },
    { id: 'margin', label: 'Price Channels', sub: 'Agent / Retail', icon: BadgePercent },
    { id: 'users', label: 'Team Access', sub: 'ผู้ใช้งานระบบ', icon: UsersIcon },
  ];
  const salesLinks = [
    { id: 'sales-calc', label: 'Pricing Desk', sub: 'คำนวณราคา', icon: Calculator },
    { id: 'dashboard', label: 'Overview', sub: 'ภาพรวมราคา', icon: LayoutDashboard },
  ];
  const links = currentUser.role === 'admin' ? adminLinks : salesLinks;
  const activeLink = links.find((x) => x.id === activeTab) || links[0];

  const retailPreview = Math.ceil(((settings.ticketPriceTHB + settings.airportTaxTHB) + settings.marginTHB) / 500) * 500;
  const agentTicket = settings.agentTicketPriceTHB ?? 25220;
  const agentPreview = Math.ceil(((agentTicket + settings.airportTaxTHB) + (settings.agentMarginTHB ?? 3000)) / 500) * 500;

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="v7-stack">
          <section className="v7-hero">
            <div>
              <div className="v7-eyebrow"><Sparkles className="w-4 h-4"/> Central Pricing Command</div>
              <h2>บริหารราคา Agent และราคาลูกค้าทั่วไป<br/>จากข้อมูลกลางชุดเดียว</h2>
              <p>ปรับต้นทุนครั้งเดียว ระบบจะนำไปคำนวณราคาขายทั้งสองช่องทางโดยอัตโนมัติ พร้อมรักษาส่วนต่างกำไรตามนโยบายบริษัท</p>
              <div className="v7-hero-actions">
                <button className="v7-primary" onClick={() => setActiveTab('sales-calc')}><Calculator className="w-4 h-4"/> เปิด Pricing Desk</button>
                {currentUser.role === 'admin' && <button className="v7-secondary" onClick={() => setActiveTab('margin')}><BadgePercent className="w-4 h-4"/> ตั้งค่าช่องทางราคา</button>}
              </div>
            </div>
            <div className="v7-channel-preview">
              <div className="v7-channel-card retail">
                <span>RETAIL CHANNEL</span><strong>ลูกค้าทั่วไป</strong><b>{retailPreview.toLocaleString()} THB+</b><small>Margin {settings.marginTHB.toLocaleString()} THB / คน</small>
              </div>
              <div className="v7-channel-card agent">
                <span>PARTNER CHANNEL</span><strong>Agent</strong><b>{agentPreview.toLocaleString()} THB+</b><small>Margin {(settings.agentMarginTHB ?? 3000).toLocaleString()} THB / คน</small>
              </div>
            </div>
          </section>

          <section className="v7-kpis">
            <div><span>USD / THB</span><strong>{settings.exchangeRateUSD.toFixed(2)}</strong><small>อัตราแลกเปลี่ยนปัจจุบัน</small></div>
            <div><span>TOUR PRODUCTS</span><strong>{packages.length}</strong><small>โปรแกรมพร้อมเสนอขาย</small></div>
            <div><span>HOTEL RECORDS</span><strong>{hotels.length}</strong><small>รายการโรงแรมในระบบ</small></div>
            <div><span>TEAM MEMBERS</span><strong>{users.length}</strong><small>บัญชีที่เข้าถึงระบบ</small></div>
          </section>

          <section className="v7-grid-2">
            <div className="v7-panel">
              <div className="v7-panel-head"><div><span className="v7-kicker">PRICE ARCHITECTURE</span><h3>โครงสร้างราคาสองช่องทาง</h3></div><button onClick={() => setActiveTab('margin')}>จัดการ</button></div>
              <div className="v7-price-flow">
                <div><i>01</i><strong>Base cost</strong><span>ตั๋ว + ภาษี + ทัวร์ + วีซ่า</span></div>
                <ChevronRight className="w-4 h-4"/>
                <div><i>02</i><strong>Channel rule</strong><span>Retail หรือ Agent</span></div>
                <ChevronRight className="w-4 h-4"/>
                <div><i>03</i><strong>Final price</strong><span>ปัดขึ้นทุก 500 บาท</span></div>
              </div>
            </div>
            <div className="v7-panel">
              <div className="v7-panel-head"><div><span className="v7-kicker">QUICK ACTIONS</span><h3>จัดการข้อมูลกลาง</h3></div></div>
              <div className="v7-quick-grid">
                {adminLinks.slice(2,8).map((item) => <button key={item.id} onClick={() => setActiveTab(item.id)}><item.icon className="w-5 h-5"/><span><b>{item.label}</b><small>{item.sub}</small></span><ArrowUpRight className="w-4 h-4"/></button>)}
              </div>
            </div>
          </section>
        </div>
      );
    }
    if (activeTab === 'sales-calc') return <SalesQuotationView settings={settings} hotels={hotels} packages={packages} currentUser={currentUser}/>;
    if (activeTab === 'hotels' && currentUser.role === 'admin') return <HotelManagementView hotels={hotels} onAdd={handleAddHotel} onUpdate={handleUpdateHotel} onDelete={handleDeleteHotel} showToast={showToast}/>;
    if (activeTab === 'packages' && currentUser.role === 'admin') return <TourPackageView packages={packages} onAdd={handleAddPackage} onUpdate={handleUpdatePackage} onDelete={handleDeletePackage} showToast={showToast}/>;
    if (activeTab === 'flight' && currentUser.role === 'admin') return <FlightSettingsView settings={settings} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'exchange-rate' && currentUser.role === 'admin') return <ExchangeRateView settings={settings} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'visa' && currentUser.role === 'admin') return <VisaSettingsView settings={settings} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'margin' && currentUser.role === 'admin') return <MarginSettingsView settings={settings} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'users' && currentUser.role === 'admin') return <UsersManagementView users={users} onAdd={handleAddUser} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} showToast={showToast}/>;
    return <DatabaseSchemaView/>;
  };

  return (
    <div className="v7-app">
      <aside className={`v7-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="v7-brand">
          <BhutanCenterLogo size="sm"/>
          <div><strong>Bhutan Center</strong><span>Pricing OS</span></div>
          <button className="v7-close md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        <div className="v7-status"><span/><div><b>Supabase Live</b><small>Cloud data connected</small></div></div>
        <nav className="v7-nav">
          <label>WORKSPACE</label>
          {links.map((link) => {
            const Icon = link.icon;
            const active = activeTab === link.id;
            return <button key={link.id} className={active ? 'active' : ''} onClick={() => {setActiveTab(link.id); setIsSidebarOpen(false)}}><Icon className="w-[19px] h-[19px]"/><span><b>{link.label}</b><small>{link.sub}</small></span>{active && <i/>}</button>;
          })}
        </nav>
        <div className="v7-user-card">
          <div className="v7-avatar">{currentUser.name?.[0]?.toUpperCase() || 'U'}</div>
          <div><b>{currentUser.name}</b><small>{currentUser.role === 'admin' ? 'Administrator' : 'Sales Partner'}</small></div>
          <button onClick={handleLogout}><LogOut className="w-4 h-4"/></button>
        </div>
      </aside>

      {isSidebarOpen && <button className="v7-backdrop md:hidden" onClick={() => setIsSidebarOpen(false)}/>}

      <div className="v7-main">
        <header className="v7-topbar">
          <button className="v7-menu md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu className="w-5 h-5"/></button>
          <div><span>BHUTAN CENTER / {activeLink.label.toUpperCase()}</span><h1>{activeLink.sub}</h1></div>
          <div className="v7-top-actions"><LanguageSwitcher compact/><div className="v7-live"><span/> LIVE DATA</div><button><Bell className="w-[18px] h-[18px]"/></button></div>
        </header>
        <main className="v7-content">{renderContent()}</main>
      </div>
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))}/>
    </div>
  );
}
