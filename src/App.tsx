import React, { useEffect, useState } from 'react';
import {
  Calculator, LayoutDashboard, Map, Hotel as HotelIcon, Plane, TrendingUp,
  CreditCard, BadgePercent, Users as UsersIcon, LogOut, Menu, X, RefreshCw,
  ArrowLeft, Settings2, ShieldCheck, ChevronRight, Database, Sparkles
} from 'lucide-react';
import { User, Hotel, TourPackage, GlobalSettings } from './types';
import { database } from './db/database';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import {
  ExchangeRateView, FlightSettingsView, HotelManagementView, TourPackageView,
  VisaSettingsView, MarginSettingsView, UsersManagementView, DatabaseSchemaView,
  SalesQuotationView, useToast, ToastContainer
} from './components/DashboardViews';
import { BhutanCenterLogo } from './components/BhutanCenterLogo';
import { LanguageSwitcher } from './i18n';

type Workspace = 'front' | 'admin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workspace, setWorkspace] = useState<Workspace>('front');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toasts, showToast, setToasts } = useToast();

  useEffect(() => {
    const bootstrap = async () => {
      if (!isSupabaseConfigured) return loadDatabase();
      try {
        const session = await supabaseAuth.getSession();
        if (!session?.user) return setIsLoadingData(false);
        const profile = await fetchProfile(session.user.id);
        setCurrentUser({
          id: profile.id,
          name: profile.name || session.user.email?.split('@')[0] || 'User',
          email: profile.email || session.user.email || '',
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
      setSettings(nextSettings); setHotels(nextHotels); setPackages(nextPackages); setUsers(nextUsers);
    } catch (error: any) {
      showToast(`โหลดข้อมูลไม่สำเร็จ: ${error?.message || 'Unknown error'}`);
    } finally { setIsLoadingData(false); }
  };

  const persist = async (action: () => Promise<void>, success: string, refresh: () => Promise<any> | void) => {
    try { await action(); await refresh(); showToast(success); }
    catch (error: any) { showToast(`บันทึกไม่สำเร็จ: ${error?.message || 'Unknown error'}`); }
  };

  const handleSaveSettings = (value: GlobalSettings) => persist(
    () => database.saveSettings(value), 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
    async () => setSettings(await database.getSettings())
  );
  const handleAddHotel = (value: Hotel) => persist(() => database.saveHotel(value), 'เพิ่มโรงแรมเรียบร้อยแล้ว', async () => setHotels(await database.getHotels()));
  const handleUpdateHotel = (value: Hotel) => persist(() => database.saveHotel(value), 'อัปเดตโรงแรมเรียบร้อยแล้ว', async () => setHotels(await database.getHotels()));
  const handleDeleteHotel = (id: string) => persist(() => database.deleteHotel(id), 'ลบโรงแรมเรียบร้อยแล้ว', async () => setHotels(await database.getHotels()));
  const handleAddPackage = (value: TourPackage) => persist(() => database.savePackage(value), 'เพิ่มโปรแกรมทัวร์เรียบร้อยแล้ว', async () => setPackages(await database.getPackages()));
  const handleUpdatePackage = (value: TourPackage) => persist(() => database.savePackage(value), 'อัปเดตโปรแกรมทัวร์เรียบร้อยแล้ว', async () => setPackages(await database.getPackages()));
  const handleDeletePackage = (id: string) => persist(() => database.deletePackage(id), 'ลบโปรแกรมทัวร์เรียบร้อยแล้ว', async () => setPackages(await database.getPackages()));
  const handleAddUser = (value: User) => persist(() => database.saveUser(value), 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว', async () => setUsers(await database.getUsers()));
  const handleUpdateUser = async (value: User) => { await persist(() => database.saveUser(value), 'อัปเดตผู้ใช้งานเรียบร้อยแล้ว', async () => setUsers(await database.getUsers())); if (currentUser?.id === value.id) setCurrentUser(value); };
  const handleDeleteUser = (id: string) => persist(() => database.deleteUser(id), 'ลบผู้ใช้งานเรียบร้อยแล้ว', async () => setUsers(await database.getUsers()));

  const handleLogout = async () => { if (isSupabaseConfigured) await supabaseAuth.signOut(); setCurrentUser(null); showToast('ออกจากระบบเรียบร้อยแล้ว'); };

  if (isLoadingData || (currentUser && !settings)) {
    return <div className="v9-loading"><RefreshCw className="animate-spin"/><p>กำลังเตรียมระบบราคา…</p></div>;
  }

  if (!currentUser) {
    return <><AuthScreen users={users} onLoginSuccess={async (user) => {
      if (!users.some(x => x.id === user.id || x.email.toLowerCase() === user.email.toLowerCase())) {
        await database.saveUser(user); setUsers(await database.getUsers());
      }
      setCurrentUser(user); await loadDatabase(); setWorkspace('front'); setActiveTab('dashboard');
      showToast(`ยินดีต้อนรับ ${user.name}`);
    }}/><ToastContainer toasts={toasts} onClose={(id)=>setToasts(v=>v.filter(x=>x.id!==id))}/></>;
  }

  const adminItems = [
    { id: 'dashboard', label: 'ภาพรวมหลังบ้าน', icon: LayoutDashboard },
    { id: 'packages', label: 'โปรแกรมทัวร์', icon: Map },
    { id: 'hotels', label: 'โรงแรมและห้องพัก', icon: HotelIcon },
    { id: 'flight', label: 'ราคาตั๋วและภาษี', icon: Plane },
    { id: 'exchange-rate', label: 'อัตราแลกเปลี่ยน', icon: TrendingUp },
    { id: 'visa', label: 'วีซ่าและค่าธรรมเนียม', icon: CreditCard },
    { id: 'margin', label: 'ราคา Retail / Agent', icon: BadgePercent },
    { id: 'users', label: 'ผู้ใช้งานระบบ', icon: UsersIcon },
  ];

  const renderAdminContent = () => {
    if (activeTab === 'dashboard') return <AdminHome settings={settings!} packages={packages} hotels={hotels} users={users} onOpen={setActiveTab}/>;
    if (activeTab === 'packages') return <TourPackageView packages={packages} onAdd={handleAddPackage} onUpdate={handleUpdatePackage} onDelete={handleDeletePackage} showToast={showToast}/>;
    if (activeTab === 'hotels') return <HotelManagementView hotels={hotels} onAdd={handleAddHotel} onUpdate={handleUpdateHotel} onDelete={handleDeleteHotel} showToast={showToast}/>;
    if (activeTab === 'flight') return <FlightSettingsView settings={settings!} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'exchange-rate') return <ExchangeRateView settings={settings!} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'visa') return <VisaSettingsView settings={settings!} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'margin') return <MarginSettingsView settings={settings!} onSave={handleSaveSettings} showToast={showToast}/>;
    if (activeTab === 'users') return <UsersManagementView users={users} onAdd={handleAddUser} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} showToast={showToast}/>;
    return <DatabaseSchemaView/>;
  };

  if (workspace === 'front') {
    return <div className="v9-front-shell">
      <header className="v9-front-header">
        <BhutanCenterLogo size="sm"/>
        <div className="v9-front-actions">
          <LanguageSwitcher compact/>
          {currentUser.role === 'admin' && <button className="v9-admin-entry" onClick={()=>setWorkspace('admin')}><Settings2/>หลังบ้าน</button>}
          <button className="v9-avatar" title={currentUser.name}>{currentUser.name?.[0]?.toUpperCase()}</button>
        </div>
      </header>
      <main className="v9-front-main">
        <section className="v9-front-intro">
          <div><span className="v9-badge"><Sparkles/>BHUTAN PRICING</span><h1>คำนวณราคาทัวร์<br/><em>ง่ายในหน้าเดียว</em></h1><p>เลือกโปรแกรม จำนวนผู้เดินทาง โรงแรม และช่องทางราคา ระบบจะสรุปราคา Retail หรือ Agent ให้ทันที</p></div>
          <div className="v9-live-card"><span>ฐานข้อมูลออนไลน์</span><strong>{packages.length} โปรแกรม</strong><small>{hotels.length} โรงแรม · อัปเดตจาก Supabase</small></div>
        </section>
        <section className="v9-calculator-card"><SalesQuotationView settings={settings!} hotels={hotels} packages={packages} currentUser={currentUser}/></section>
      </main>
      <ToastContainer toasts={toasts} onClose={(id)=>setToasts(v=>v.filter(x=>x.id!==id))}/>
    </div>;
  }

  return <div className="v9-admin-shell">
    <aside className={`v9-admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="v9-side-brand"><BhutanCenterLogo size="sm"/><button onClick={()=>setSidebarOpen(false)}><X/></button></div>
      <div className="v9-side-label">BACK OFFICE</div>
      <nav>{adminItems.map(item => <button key={item.id} className={activeTab===item.id?'active':''} onClick={()=>{setActiveTab(item.id);setSidebarOpen(false)}}><item.icon/><span>{item.label}</span><ChevronRight/></button>)}</nav>
      <div className="v9-side-bottom">
        <button onClick={()=>setWorkspace('front')}><ArrowLeft/>กลับหน้าคำนวณ</button>
        <button onClick={handleLogout}><LogOut/>ออกจากระบบ</button>
      </div>
    </aside>
    {sidebarOpen && <button className="v9-backdrop" onClick={()=>setSidebarOpen(false)}/>}
    <main className="v9-admin-main">
      <header className="v9-admin-header">
        <button className="v9-menu" onClick={()=>setSidebarOpen(true)}><Menu/></button>
        <div><span>BACK OFFICE</span><h1>{adminItems.find(x=>x.id===activeTab)?.label || 'ภาพรวมหลังบ้าน'}</h1></div>
        <div className="v9-header-actions"><LanguageSwitcher compact/><span className="v9-cloud"><i/>Supabase Live</span><button className="v9-user-chip"><b>{currentUser.name}</b><small>{currentUser.role}</small></button></div>
      </header>
      <section className="v9-admin-content">{renderAdminContent()}</section>
    </main>
    <ToastContainer toasts={toasts} onClose={(id)=>setToasts(v=>v.filter(x=>x.id!==id))}/>
  </div>;
}

function AdminHome({ settings, packages, hotels, users, onOpen }: { settings: GlobalSettings; packages: TourPackage[]; hotels: Hotel[]; users: User[]; onOpen: (id:string)=>void }) {
  const cards = [
    { label:'ราคาตั๋วปกติ', value:`${settings.ticketPriceTHB.toLocaleString()} ฿`, note:'Retail / คน', id:'flight', icon:Plane },
    { label:'ราคาตั๋ว Agent', value:`${(settings.agentTicketPriceTHB ?? 25220).toLocaleString()} ฿`, note:'Agent / คน', id:'flight', icon:BadgePercent },
    { label:'อัตราแลกเปลี่ยน', value:`${settings.exchangeRateUSD.toFixed(2)}`, note:'THB ต่อ USD', id:'exchange-rate', icon:TrendingUp },
    { label:'โปรแกรมพร้อมขาย', value:packages.length.toString(), note:`${hotels.length} โรงแรม`, id:'packages', icon:Map },
  ];
  return <div className="v9-admin-home">
    <section className="v9-admin-hero"><div><span><ShieldCheck/>CONTROL CENTER</span><h2>จัดการข้อมูลราคา<br/>จากศูนย์กลางเดียว</h2><p>ข้อมูลที่แก้ไขในหลังบ้านจะถูกนำไปใช้ในหน้าคำนวณราคาทันที</p></div><button onClick={()=>onOpen('margin')}><Settings2/>ตั้งค่าช่องทางราคา</button></section>
    <div className="v9-stat-grid">{cards.map(card=><button key={card.label} onClick={()=>onOpen(card.id)}><span className="v9-stat-icon"><card.icon/></span><small>{card.label}</small><strong>{card.value}</strong><em>{card.note}</em></button>)}</div>
    <section className="v9-admin-panels"><div><header><span>ข้อมูลหลัก</span><h3>จัดการรายการ</h3></header><div className="v9-action-list">
      {[['packages','โปรแกรมทัวร์',`${packages.length} รายการ`,Map],['hotels','โรงแรมและห้องพัก',`${hotels.length} รายการ`,HotelIcon],['users','ผู้ใช้งานระบบ',`${users.length} บัญชี`,UsersIcon]].map(([id,label,note,Icon]:any)=><button key={id} onClick={()=>onOpen(id)}><Icon/><span><b>{label}</b><small>{note}</small></span><ChevronRight/></button>)}
    </div></div><div><header><span>โครงสร้างราคา</span><h3>ค่ากลางปัจจุบัน</h3></header><dl className="v9-summary-list"><div><dt>กำไร Retail</dt><dd>{settings.marginTHB.toLocaleString()} ฿</dd></div><div><dt>กำไร Agent</dt><dd>{(settings.agentMarginTHB ?? 3000).toLocaleString()} ฿</dd></div><div><dt>ค่าธรรมเนียมวีซ่า</dt><dd>{settings.visaFeeUSD.toLocaleString()} USD</dd></div><div><dt>ภาษีสนามบิน</dt><dd>{settings.airportTaxTHB.toLocaleString()} ฿</dd></div></dl></div></section>
  </div>;
}
