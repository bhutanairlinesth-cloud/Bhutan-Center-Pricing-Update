import React, { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from '../types';
import { BhutanCenterLogo } from './BhutanCenterLogo';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from '../lib/supabase';

interface AuthScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void | Promise<void>;
}

export function AuthScreen({ users, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const session = await supabaseAuth.signInWithPassword(email.trim(), password);
        const profile = await fetchProfile(session.user.id);

        await onLoginSuccess({
          id: profile.id,
          name: profile.name || session.user.email?.split('@')[0] || 'User',
          email: profile.email || session.user.email || email,
          role: profile.role,
          createdAt: profile.created_at,
        });
      } else {
        const match = users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
        if (!match) throw new Error('ไม่พบบัญชีนี้ในโหมดทดสอบ');
        await onLoginSuccess(match);
      }
    } catch (err: any) {
      setError(err?.message === 'Invalid login credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : err?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-5 md:p-10 font-sans">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.12fr_0.88fr] overflow-hidden rounded-[32px] border border-white/70 bg-white/90 backdrop-blur-xl premium-shadow-xl relative z-10">
        <section className="hidden lg:flex flex-col justify-between p-12 xl:p-14 bg-brand-emerald text-white relative overflow-hidden">
          <div className="absolute inset-0 auth-pattern opacity-30" />
          <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -bottom-12 w-52 h-52 rounded-full border border-brand-gold/30" />

          <div className="relative">
            <BhutanCenterLogo size="md" />
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-light" />
              Central Pricing Workspace
            </div>
            <h1 className="mt-6 text-5xl leading-[1.08] font-serif font-bold max-w-lg">
              จัดการราคาทัวร์ภูฏาน<br />ได้แม่นยำในที่เดียว
            </h1>
            <p className="mt-5 text-emerald-50/75 leading-7 max-w-md">
              ควบคุมเรตเงิน ตั๋วเครื่องบิน โรงแรม โปรแกรมทัวร์ และกำไร พร้อมข้อมูลส่วนกลางที่ซิงก์ผ่าน Supabase
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {['Live Pricing', 'Role Access', 'Cloud Data'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/8 p-3 text-center text-xs font-semibold text-white/80">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <BhutanCenterLogo size="sm" />
            <div>
              <p className="font-serif font-bold text-brand-emerald text-lg">Bhutan Center Pricing</p>
              <p className="text-[10px] tracking-[0.15em] text-slate-400 uppercase">Operations Console</p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-bold border border-emerald-100">
            <ShieldCheck className="w-4 h-4" /> Secure Staff Access
          </div>
          <h2 className="mt-5 text-3xl font-serif font-bold text-slate-900">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-slate-500">ใช้บัญชีพนักงานที่สร้างไว้ใน Supabase Authentication</p>

          {error && (
            <div className="mt-6 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input pl-11"
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</span>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="modern-input pl-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </label>

            <button type="submit" disabled={isLoading} className="primary-action w-full">
              {isLoading ? <span className="button-spinner" /> : <LockKeyhole className="w-4 h-4" />}
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-auto" />}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{isSupabaseConfigured ? 'Supabase connected' : 'Local fallback mode'}</span>
            <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} /> System status</span>
          </div>
        </section>
      </div>
    </div>
  );
}
