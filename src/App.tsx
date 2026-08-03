/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, TrendingUp, Plane, Hotel as HotelIcon, Map, CreditCard, 
  Percent, Users as UsersIcon, Settings, LogOut, Menu, X, 
  Sparkles, RefreshCw, Calculator, Database, HelpCircle
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
    { id: 'dashboard', label: 'แดชบอร์ด (Dashboard)', icon: Shield },
    { id: 'exchange-rate', label: 'อัตราแลกเปลี่ยน (Exchange Rate)', icon: TrendingUp },
    { id: 'flight', label: 'ตั้งค่าราคาตั๋วบิน (Flight Settings)', icon: Plane },
    { id: 'packages', label: 'โปรแกรมเดินทาง (Travel Packages)', icon: Map },
    { id: 'visa', label: 'ตั้งค่าค่าวีซ่า (Visa Settings)', icon: CreditCard },
    { id: 'margin', label: 'ตั้งค่ากำไรส่วนต่าง (Margin Control)', icon: Percent },
    { id: 'users', label: 'ผู้ใช้งานระบบ (Users List)', icon: UsersIcon },
    { id: 'schema', label: 'โครงสร้างฐานข้อมูล (Database Schema)', icon: Database },
  ];

  const salesLinks = [
    { id: 'sales-calc', label: 'คำนวณราคาทัวร์ (Quotation Engine)', icon: Calculator },
    { id: 'schema-view-only', label: 'โครงสร้างฐานข้อมูล (Database Schema)', icon: Database },
  ];

  const activeLinks = currentUser.role === 'admin' ? adminLinks : salesLinks;

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-gray-800">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-100 h-16 shrink-0 flex items-center justify-between px-6 z-30 sticky top-0 premium-shadow">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 md:hidden hover:bg-slate-50 border rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>

          <div className="flex items-center gap-2">
            <BhutanCenterLogo size="sm" />
            <div>
              <span className="font-serif font-bold text-lg text-brand-emerald tracking-tight block leading-tight">
                Bhutan Center Pricing
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-[0.14em] uppercase">Tour Operations Console</span>
            </div>
            <span className={`hidden lg:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isSupabaseConfigured ? 'SUPABASE LIVE' : 'LOCAL MODE'}
            </span>
          </div>
        </div>

        {/* User Badge Profile Section */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 font-medium font-mono uppercase mt-0.5 tracking-wider">
              {currentUser.role === 'admin' ? '⚜️ System Admin' : '💼 Sales Agent'}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden sm:block" />
          
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 px-3 py-2 rounded-xl border border-transparent hover:border-rose-100 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Terminate</span>
          </button>
        </div>
      </header>

      {/* CORE WRAPPER CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDE NAVIGATION DRAWER / PANEL */}
        <aside className={`
          fixed md:sticky top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-40 p-4 flex flex-col justify-between transition-transform duration-250 shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-3">
                Navigation Matrix
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
                          ? 'bg-brand-emerald text-white premium-shadow' 
                          : 'text-gray-500 hover:text-brand-emerald hover:bg-slate-50'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isCurrent ? 'text-brand-gold-light' : 'text-gray-400'}`} />
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
                  Validation Tools
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
                  Test Sales Portal
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
                Reset Database
              </button>
            )}

            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider font-mono">
                Engine version 2.4.0
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                © 2026 Bhutan Travel Center
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY HUB */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
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
