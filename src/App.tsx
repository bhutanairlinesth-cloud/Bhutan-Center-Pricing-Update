/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Plane, Map, CreditCard, Percent,
  Users as UsersIcon, LogOut, Menu, X, RefreshCw, Calculator,
  Database, ChevronRight, Bell, Search
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

export default function App() {
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

  // SIDEBAR LINK MATRIX
  const adminLinks = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'exchange-rate', label: 'อัตราแลกเปลี่ยน', icon: TrendingUp },
    { id: 'flight', label: 'ราคาตั๋วเครื่องบิน', icon: Plane },
    { id: 'packages', label: 'โปรแกรมทัวร์', icon: Map },
    { id: 'visa', label: 'ค่าวีซ่าและค่าธรรมเนียม', icon: CreditCard },
    { id: 'margin', label: 'กำไรและส่วนต่าง', icon: Percent },
    { id: 'users', label: 'ผู้ใช้งานระบบ', icon: UsersIcon },
    { id: 'schema', label: 'ฐานข้อมูล', icon: Database },
  ];

  const salesLinks = [
    { id: 'sales-calc', label: 'คำนวณราคาและใบเสนอราคา', icon: Calculator },
    { id: 'schema-view-only', label: 'ฐานข้อมูล', icon: Database },
  ];

  const activeLinks = currentUser.role === 'admin' ? adminLinks : salesLinks;

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans text-slate-800">
      
      {/* HEADER BAR */}
      <header className="app-topbar h-[72px] shrink-0 flex items-center justify-between px-4 md:px-7 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mobile-menu-btn p-2 md:hidden"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>

          <div className="flex items-center gap-3">
            <BhutanCenterLogo size="sm" />
            <div>
              <span className="brand-title text-[17px] font-bold tracking-tight block leading-tight">
                Bhutan Center Pricing
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase">Tour Operations Console</span>
            </div>
            <span className={`hidden lg:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isSupabaseConfigured ? 'Online' : 'Local'}
            </span>
          </div>
        </div>

        {/* User Badge Profile Section */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 font-medium font-mono uppercase mt-0.5 tracking-wider">
              {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ฝ่ายขาย'}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden sm:block" />
          
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 px-3 py-2 rounded-xl border border-transparent hover:border-rose-100 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* CORE WRAPPER CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDE NAVIGATION DRAWER / PANEL */}
        <aside className={`
          app-sidebar fixed md:sticky top-[72px] left-0 bottom-0 w-[272px] z-40 p-4 flex flex-col justify-between transition-transform duration-250 shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-3">
                เมนูหลัก
              </span>
              <nav className="space-y-1">
                {activeLinks.map((link) => {
                  const Icon = link.icon;
                  const isCurrent = activeTab === link.id || (link.id === 'schema-view-only' && activeTab === 'schema');
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.id === 'schema-view-only') {
                          setActiveTab('schema');
                        } else {
                          setActiveTab(link.id);
                        }
                        setIsSidebarOpen(false);
                      }}
                      id={`sidebar-link-${link.id}`}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer
                        ${isCurrent 
                          ? 'nav-item-active' 
                          : 'nav-item-idle'
                        }
                      `}
                    >
                      <span className={`nav-icon ${isCurrent ? 'nav-icon-active' : ''}`}><Icon className="w-[18px] h-[18px]" /></span>
                      {link.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Admin Extra feature: Access Sales engine directly to test pricing */}
            {currentUser.role === 'admin' && (
              <div className="border-t border-gray-100 pt-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-2">
                  เครื่องมือ
                </span>
                <button
                  onClick={() => {
                    setActiveTab('sales-calc');
                    setIsSidebarOpen(false);
                  }}
                  id="admin-test-sales-calc-btn"
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer
                    ${activeTab === 'sales-calc' 
                      ? 'bg-emerald-900 text-white premium-shadow' 
                      : 'text-brand-emerald border border-dashed border-brand-emerald/30 hover:border-brand-emerald hover:bg-emerald-50/20'
                    }
                  `}
                >
                  <Calculator className="w-4 h-4 text-brand-gold-light" />
                  ทดลองคำนวณราคา
                </button>
              </div>
            )}
          </div>

          {/* System Footer Options */}
          <div className="space-y-3">
            {currentUser.role === 'admin' && (
              <button
                onClick={handleResetSystem}
                id="reset-db-btn"
                className="w-full flex items-center justify-center gap-2 border border-dashed border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-reverse" />
                รีเซ็ตฐานข้อมูล
              </button>
            )}

            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider font-mono">
                BHUTAN PRICING CLOUD
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Secure cloud workspace
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY HUB */}
        <main className="app-main flex-1 overflow-y-auto p-4 md:p-7 lg:p-9">
          <div className="max-w-[1480px] mx-auto">
            <div className="workspace-toolbar">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <span>Bhutan Center</span><ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-600">{activeLinks.find(x => x.id === activeTab)?.label || (activeTab === 'sales-calc' ? 'คำนวณราคาและใบเสนอราคา' : 'ฐานข้อมูล')}</span>
                </div>
                <h1 className="workspace-title">{activeLinks.find(x => x.id === activeTab)?.label || (activeTab === 'sales-calc' ? 'คำนวณราคาและใบเสนอราคา' : 'ฐานข้อมูล')}</h1>
              </div>
              <div className="workspace-actions">
                <div className="quick-search hidden lg:flex"><Search className="w-4 h-4" /><span>ค้นหาข้อมูล...</span><kbd>⌘ K</kbd></div>
                <button className="icon-action" aria-label="notifications"><Bell className="w-[18px] h-[18px]" /><span className="notification-dot" /></button>
              </div>
            </div>
            {/* RENDER ACTIVE TAB */}
            {activeTab === 'dashboard' && currentUser.role === 'admin' && (
              <AdminDashboardOverview 
                hotels={hotels} 
                packages={packages} 
                settings={settings} 
                users={users}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'exchange-rate' && currentUser.role === 'admin' && (
              <ExchangeRateView 
                settings={settings} 
                onSave={handleSaveSettings} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'flight' && currentUser.role === 'admin' && (
              <FlightSettingsView 
                settings={settings} 
                onSave={handleSaveSettings} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'packages' && currentUser.role === 'admin' && (
              <TourPackageView 
                packages={packages} 
                onAdd={handleAddPackage} 
                onUpdate={handleUpdatePackage} 
                onDelete={handleDeletePackage} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'visa' && currentUser.role === 'admin' && (
              <VisaSettingsView 
                settings={settings} 
                onSave={handleSaveSettings} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'margin' && currentUser.role === 'admin' && (
              <MarginSettingsView 
                settings={settings} 
                onSave={handleSaveSettings} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'users' && currentUser.role === 'admin' && (
              <UsersManagementView 
                users={users} 
                onAdd={handleAddUser} 
                onUpdate={handleUpdateUser}
                onDelete={handleDeleteUser} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'schema' && (
              <DatabaseSchemaView />
            )}

            {activeTab === 'sales-calc' && (
              <SalesQuotationView 
                settings={settings} 
                hotels={hotels} 
                packages={packages} 
                currentUser={currentUser}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating System-Wide Alerts */}
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
