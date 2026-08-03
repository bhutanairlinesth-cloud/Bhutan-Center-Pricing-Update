import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { fetchProfile, isSupabaseConfigured, supabaseAuth } from '../lib/supabase';
import { useI18n, LanguageSwitch } from '../i18n';
import { Brand } from './Brand';

export function Login({ users, onSuccess }: { users: User[]; onSuccess: (user: User) => Promise<void> | void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError(t('loginHint')); return; }
    setBusy(true);
    try {
      if (isSupabaseConfigured) {
        const session = await supabaseAuth.signInWithPassword(email.trim(), password);
        const profile = await fetchProfile(session.user.id);
        await onSuccess({
          id: profile.id,
          name: profile.name || session.user.email?.split('@')[0] || 'User',
          email: profile.email || session.user.email || email,
          role: profile.role,
          createdAt: profile.created_at,
        });
      } else {
        const match = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
        if (!match) throw new Error('Account not found in local mode');
        await onSuccess(match);
      }
    } catch (err: any) {
      setError(err?.message || t('error'));
    } finally { setBusy(false); }
  }

  return <main className="login-shell">
    <section className="login-visual">
      <div className="login-visual-grid"/>
      <Brand light/>
      <div className="login-copy">
        <span className="eyebrow">BHUTAN PRICING WORKSPACE</span>
        <h1>{t('tagline')}</h1>
        <p>Retail · Agent · Quotation · Supabase</p>
      </div>
      <div className="login-metrics">
        <div><b>2</b><span>Pricing channels</span></div>
        <div><b>1</b><span>Central database</span></div>
        <div><b>24/7</b><span>Cloud access</span></div>
      </div>
    </section>
    <section className="login-form-panel">
      <div className="login-form-wrap">
        <div className="login-form-top"><LanguageSwitch/><span className={`connection-pill ${isSupabaseConfigured ? 'online' : ''}`}><i/>{isSupabaseConfigured ? t('online') : t('local')}</span></div>
        <div className="mobile-brand"><Brand/></div>
        <span className="secure-label"><ShieldCheck/>{t('secureCloud')}</span>
        <h2>{t('welcome')}</h2>
        <p className="muted">{t('loginHint')}</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit} className="login-form">
          <label className="field"><span>{t('email')}</span><div className="input-with-icon"><Mail/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('enterEmail')} autoComplete="email"/></div></label>
          <label className="field"><span>{t('password')}</span><div className="input-with-icon"><LockKeyhole/><input type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('enterPassword')} autoComplete="current-password"/><button type="button" onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff/> : <Eye/>}</button></div></label>
          <button className="primary-button login-button" type="submit" disabled={busy}><span>{busy ? t('signingIn') : t('signIn')}</span><ArrowRight/></button>
        </form>
      </div>
    </section>
  </main>;
}
