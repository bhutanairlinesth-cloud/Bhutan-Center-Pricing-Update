import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { BhutanCenterLogo } from './BhutanCenterLogo';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from '../lib/supabase';
import { LanguageSwitcher } from '../i18n';

interface AuthScreenProps { users: User[]; onLoginSuccess: (user: User) => void | Promise<void>; }

export function AuthScreen({ users, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!email.trim() || !password.trim()) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const session = await supabaseAuth.signInWithPassword(email.trim(), password);
        const profile = await fetchProfile(session.user.id);
        await onLoginSuccess({ id: profile.id, name: profile.name || session.user.email?.split('@')[0] || 'User', email: profile.email || session.user.email || email, role: profile.role, createdAt: profile.created_at });
      } else {
        const match = users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
        if (!match) throw new Error('ไม่พบบัญชีนี้ในโหมดทดสอบ');
        await onLoginSuccess(match);
      }
    } catch (err: any) {
      setError(err?.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : err?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="login-page min-h-screen font-sans">
      <div className="login-ambient login-ambient-one" /><div className="login-ambient login-ambient-two" />
      <div className="login-frame">
        <section className="login-showcase">
          <div className="showcase-pattern" />
          <div className="relative z-10">
            <BhutanCenterLogo size="md" />
            <div className="showcase-chip"><Sparkles className="w-4 h-4" /> Bhutan Travel Operations</div>
            <h1>ศูนย์กลางบริหาร<br/><span>ราคาทัวร์ภูฏาน</span></h1>
            <p>รวมข้อมูลราคา ต้นทุน และกำไรไว้ในระบบเดียว เพื่อให้ทุกทีมทำงานได้เร็ว แม่นยำ และเป็นมาตรฐานเดียวกัน</p>
          </div>
          <div className="showcase-features relative z-10">
            {['ข้อมูลราคาแบบเรียลไทม์','กำหนดสิทธิ์ตามบทบาท','สำรองข้อมูลบนคลาวด์'].map((item) => <div key={item}><CheckCircle2 className="w-4 h-4" />{item}</div>)}
          </div>
          <div className="showcase-footer relative z-10"><span>BHUTAN CENTER</span><span>PRICING CLOUD · 2026</span></div>
        </section>

        <section className="login-panel">
          <div className="login-panel-inner"><div className="login-language"><LanguageSwitcher /></div>
            <div className="lg:hidden mb-9"><BhutanCenterLogo size="sm" /></div>
            <div className="security-chip"><ShieldCheck className="w-4 h-4" /> Secure workspace</div>
            <h2>ยินดีต้อนรับกลับ</h2>
            <p className="login-subtitle">เข้าสู่ระบบเพื่อจัดการข้อมูลราคาและใบเสนอราคา</p>
            {error && <div className="login-error"><AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span></div>}
            <form onSubmit={handleLogin} className="login-form">
              <label><span>อีเมล</span><div className="login-input-wrap"><Mail className="w-[18px] h-[18px]" /><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email" disabled={isLoading}/></div></label>
              <label><span>รหัสผ่าน</span><div className="login-input-wrap"><KeyRound className="w-[18px] h-[18px]" /><input type={showPassword?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" autoComplete="current-password" disabled={isLoading}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff className="w-[18px] h-[18px]"/>:<Eye className="w-[18px] h-[18px]"/>}</button></div></label>
              <button type="submit" disabled={isLoading} className="login-submit">{isLoading?<span className="button-spinner"/>:<LockKeyhole className="w-[18px] h-[18px]"/>}<span>{isLoading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</span>{!isLoading&&<ArrowRight className="w-[18px] h-[18px] ml-auto"/>}</button>
            </form>
            <div className="login-status"><span><i className={isSupabaseConfigured?'online':''}/>{isSupabaseConfigured?'ระบบออนไลน์':'โหมดภายในเครื่อง'}</span><span>ข้อมูลได้รับการปกป้อง</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
