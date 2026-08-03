/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, UserCheck, Database, Calculator } from 'lucide-react';
import { User } from '../types';
import { BhutanCenterLogo } from './BhutanCenterLogo';

interface AuthScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export function AuthScreen({ users, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Simulate database credentials check
    setTimeout(() => {
      const match = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (match) {
        onLoginSuccess(match);
      } else {
        // If they enter any custom email, we can register them as sales on-the-fly or reject.
        // Let's allow quick demo login for comfort!
        if (email.includes('@')) {
          const newUser: User = {
            id: 'usr_' + Math.random().toString(36).substring(2, 9),
            name: email.split('@')[0],
            email: email.trim(),
            role: 'sales',
            createdAt: new Date().toISOString()
          };
          onLoginSuccess(newUser);
        } else {
          setError('รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          setIsLoading(false);
        }
      }
    }, 400);
  };

  const handlePresetLogin = (presetEmail: string) => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const match = users.find(u => u.email === presetEmail);
      if (match) {
        onLoginSuccess(match);
      } else {
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4 md:p-8 relative font-sans overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-emerald/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Container Card */}
      <div className="max-w-5xl w-full bg-white rounded-[2rem] border border-emerald-950/5 premium-shadow-lg overflow-hidden relative z-10 grid lg:grid-cols-[1.05fr_.95fr]">
        {/* Brand panel */}
        <section className="relative overflow-hidden bg-brand-emerald text-white p-8 md:p-12 flex flex-col justify-between min-h-[330px] lg:min-h-[620px]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-brand-gold/30" />
          <div className="absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-black/15 to-transparent" />
          <div className="relative">
            <BhutanCenterLogo size="lg" />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.28em] text-brand-gold-light">Bhutan Center</p>
            <h1 className="mt-3 max-w-lg font-serif text-4xl md:text-5xl font-bold leading-tight">ระบบคำนวณราคาทัวร์ภูฏาน</h1>
            <p className="mt-4 max-w-md text-sm md:text-base leading-7 text-emerald-50/80">จัดการต้นทุน โปรแกรมเดินทาง อัตราแลกเปลี่ยน และสร้างราคาขายได้ในระบบเดียว</p>
          </div>
          <div className="relative grid grid-cols-2 gap-3 mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <Database className="h-5 w-5 text-brand-gold-light" />
              <p className="mt-3 text-sm font-bold">ข้อมูลราคาเป็นระบบ</p>
              <p className="mt-1 text-xs text-emerald-50/65">ตั้งค่ากลางและแพ็กเกจ</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <Calculator className="h-5 w-5 text-brand-gold-light" />
              <p className="mt-3 text-sm font-bold">คำนวณรวดเร็ว</p>
              <p className="mt-1 text-xs text-emerald-50/65">รองรับทีม Admin และ Sales</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center bg-white p-6 md:p-10">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-dark">เข้าสู่ระบบ</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">ยินดีต้อนรับกลับ</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">เวอร์ชันนี้เป็นระบบทดลอง ข้อมูลจะเก็บอยู่ในเบราว์เซอร์จนกว่าจะเชื่อมฐานข้อมูลจริง</p>
        </div>

        {/* Quick Access Account Picker */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 text-center">
            เลือกบทบาทสำหรับทดลองระบบ
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Admin Preset */}
            <button
              onClick={() => handlePresetLogin('BhutanairlinesTH@gmail.com')}
              disabled={isLoading}
              className="p-3 bg-white border border-gray-100 hover:border-brand-gold hover:bg-amber-50/20 text-left rounded-xl transition premium-shadow group cursor-pointer"
              id="preset-admin-btn"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-brand-gold bg-amber-50 px-2 py-0.5 rounded-full">
                  Admin
                </span>
                <UserCheck className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-gold transition" />
              </div>
              <p className="text-xs font-semibold text-gray-800">ผู้ดูแลระบบ</p>
              <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5">BhutanairlinesTH@gmail.com</p>
            </button>

            {/* Sales Preset */}
            <button
              onClick={() => handlePresetLogin('sales@bhutancenter.com')}
              disabled={isLoading}
              className="p-3 bg-white border border-gray-100 hover:border-brand-emerald hover:bg-emerald-50/20 text-left rounded-xl transition premium-shadow group cursor-pointer"
              id="preset-sales-btn"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-brand-emerald bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sales
                </span>
                <UserCheck className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-emerald transition" />
              </div>
              <p className="text-xs font-semibold text-gray-800">ฝ่ายขาย</p>
              <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5">sales@bhutancenter.com</p>
            </button>
          </div>
        </div>

        {/* Regular Sign In Form */}
        <form onSubmit={handleLogin} className="pt-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-950 rounded-xl flex items-start gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              อีเมลผู้ใช้งาน
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm font-mono"
              placeholder="BhutanairlinesTH@gmail.com"
              disabled={isLoading}
              id="login-email-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="login-submit-btn"
            className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-3 px-4 rounded-xl transition duration-250 cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                เข้าสู่ระบบ
                <ArrowRight className="w-4 h-4 text-brand-gold-light" />
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">ก่อนใช้งานจริง ควรเชื่อมระบบสมาชิกและฐานข้อมูลส่วนกลางเพื่อให้ทุกเครื่องเห็นข้อมูลเดียวกัน</p>
        </section>
      </div>
    </div>
  );
}
