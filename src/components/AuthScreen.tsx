/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, Key, ArrowRight, UserCheck } from 'lucide-react';
import { User, UserRole } from '../types';
import { BhutanCenterLogo } from './BhutanCenterLogo';

interface AuthScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export function AuthScreen({ users, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address');
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
          setError('Invalid email address. Please select a preset card or write a valid email.');
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
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-emerald/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Container Card */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 premium-shadow-lg overflow-hidden relative z-10">
        {/* Top Header Panel (Emerald + Gold decoration) */}
        <div className="bg-brand-emerald text-white p-8 text-center relative border-b-4 border-brand-gold">
          {/* Sparkly decorative elements */}
          <div className="absolute left-6 top-6 text-brand-gold opacity-30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="absolute right-6 bottom-6 text-brand-gold opacity-30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex justify-center mb-4">
            <BhutanCenterLogo size="md" />
          </div>

          <h1 className="text-2xl font-serif font-bold tracking-tight text-white">
            Bhutan Center
          </h1>
          <p className="text-brand-gold-light text-xs font-display font-semibold uppercase tracking-widest mt-1">
            Pricing & Operations Engine
          </p>
        </div>

        {/* Quick Access Account Picker (Highly recommended for testing) */}
        <div className="p-6 pb-2 border-b border-gray-50 bg-slate-50/50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 text-center">
            🔒 Select Demo Role Credentials
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
              <p className="text-xs font-semibold text-gray-800">Primary Admin</p>
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
              <p className="text-xs font-semibold text-gray-800">Sales Agent</p>
              <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5">sales@bhutancenter.com</p>
            </button>
          </div>
        </div>

        {/* Regular Sign In Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-950 rounded-xl flex items-start gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Email Address
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Passphrase
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Default: auto-filled</span>
            </div>
            <div className="relative">
              <input
                type="password"
                value="••••••••••••"
                disabled
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-150 bg-gray-50/50 rounded-lg text-sm text-gray-400 cursor-not-allowed font-mono"
              />
              <Key className="absolute right-3 top-3 w-4 h-4 text-gray-300" />
            </div>
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
                Authenticating...
              </>
            ) : (
              <>
                Access Bhutan Center
                <ArrowRight className="w-4 h-4 text-brand-gold-light" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400 font-medium tracking-wide">
        Secure Role-Based Infrastructure. All Pricing Computations Logged.
      </div>
    </div>
  );
}
