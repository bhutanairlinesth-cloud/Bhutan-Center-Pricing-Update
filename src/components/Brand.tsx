import React, { useEffect, useState } from 'react';

const LOGO_CACHE_KEY = 'bhutan_center_brand_logo_url';

function resolveLogoUrl(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    const cached = window.localStorage.getItem(LOGO_CACHE_KEY);
    if (cached) return cached;
  }
  const projectUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  return projectUrl ? `${projectUrl}/storage/v1/object/public/branding/company-logo` : '';
}

export function Brand({ compact = false, light = false, logoUrl }: { compact?: boolean; light?: boolean; logoUrl?: string }) {
  const source = resolveLogoUrl(logoUrl);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [source]);

  const className = `brand ${compact ? 'compact' : ''} ${light ? 'light' : ''} ${source && !broken ? 'has-uploaded-logo' : ''}`;
  return <div className={className}>
    {source && !broken ? (
      <img src={source} alt="Bhutan Center / OMG Experience" onError={() => setBroken(true)}/>
    ) : (
      <>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M7 14c12 7 18 16 25 17 9 2 19-2 25 6-9 9-20 8-28 1C20 30 13 24 7 14Z" fill="currentColor" opacity=".96"/>
          <path d="M18 38c10-6 21-4 30 4-8 7-18 8-30-4Z" fill="currentColor" opacity=".72"/>
          <circle cx="49" cy="35" r="1.8" fill="white"/>
        </svg>
        {!compact && <div><strong>BHUTAN CENTER</strong><span>OMG EXPERIENCE</span></div>}
      </>
    )}
  </div>;
}

export { LOGO_CACHE_KEY };
