import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { database } from './db/database';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from './lib/supabase';
import { GlobalSettings, Hotel, TourPackage, User } from './types';
import { Login } from './components/Login';
import { FrontOffice } from './components/FrontOffice';
import { Admin } from './components/Admin';
import { ToastItem, ToastStack } from './components/Ui';
import { useI18n } from './i18n';

export default function App() {
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workspace, setWorkspace] = useState<'front' | 'admin'>('front');
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
      const [nextSettings, nextHotels, nextPackages, nextUsers] = await Promise.all([
        database.getSettings(), database.getHotels(), database.getPackages(), database.getUsers(),
      ]);
      setSettings(nextSettings);
      setHotels(nextHotels);
      setPackages(nextPackages);
      setUsers(nextUsers);
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

  async function loginSuccess(user: User) {
    setCurrentUser(user);
    if (!users.some((item) => item.id === user.id)) {
      try { await database.saveUser(user); } catch { /* profile already exists in most cases */ }
    }
    await loadData(false);
    setWorkspace('front');
  }

  async function logout() {
    await supabaseAuth.signOut();
    setCurrentUser(null);
    setWorkspace('front');
  }

  async function run(action: () => Promise<void>, success = t('saved')) {
    try { await action(); notify(success); }
    catch (error: any) { notify(`${t('error')}: ${error?.message || 'Unknown error'}`, 'error'); throw error; }
  }

  const refresh = async () => { await loadData(false); notify(t('refreshDone')); };
  const saveSettings = async (value: GlobalSettings) => run(async () => { await database.saveSettings(value); setSettings(await database.getSettings()); });
  const saveHotel = async (value: Hotel) => run(async () => { await database.saveHotel(value); setHotels(await database.getHotels()); });
  const deleteHotel = async (id: string) => run(async () => { await database.deleteHotel(id); setHotels(await database.getHotels()); }, t('deleted'));
  const savePackage = async (value: TourPackage) => run(async () => { await database.savePackage(value); setPackages(await database.getPackages()); });
  const deletePackage = async (id: string) => run(async () => { await database.deletePackage(id); setPackages(await database.getPackages()); }, t('deleted'));
  const saveUser = async (value: User) => run(async () => { await database.saveUser(value); setUsers(await database.getUsers()); });
  const deleteUser = async (id: string) => run(async () => { await database.deleteUser(id); setUsers(await database.getUsers()); }, t('deleted'));

  if (loading || (currentUser && !settings)) {
    return <div className="app-loading"><RefreshCw/><strong>{t('loading')}</strong><span>Bhutan Center Pricing</span></div>;
  }

  return <>
    {!currentUser && <Login users={users} onSuccess={loginSuccess}/>} 
    {currentUser && settings && workspace === 'front' && <FrontOffice settings={settings} packages={packages} currentUser={currentUser} onOpenAdmin={() => setWorkspace('admin')} onLogout={logout}/>} 
    {currentUser && settings && workspace === 'admin' && currentUser.role === 'admin' && <Admin
      settings={settings} hotels={hotels} packages={packages} users={users} currentUser={currentUser} mode={database.mode}
      onBack={() => setWorkspace('front')} onLogout={logout} onRefresh={refresh}
      onSaveSettings={saveSettings} onSaveHotel={saveHotel} onDeleteHotel={deleteHotel}
      onSavePackage={savePackage} onDeletePackage={deletePackage} onSaveUser={saveUser} onDeleteUser={deleteUser}
    />}
    <ToastStack items={toasts} onDismiss={(id) => setToasts((list) => list.filter((item) => item.id !== id))}/>
  </>;
}
