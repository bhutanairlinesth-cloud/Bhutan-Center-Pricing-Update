import React from 'react';

export function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <div className={`brand ${compact ? 'compact' : ''} ${light ? 'light' : ''}`}>
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7 14c12 7 18 16 25 17 9 2 19-2 25 6-9 9-20 8-28 1C20 30 13 24 7 14Z" fill="currentColor" opacity=".96"/>
      <path d="M18 38c10-6 21-4 30 4-8 7-18 8-30-4Z" fill="currentColor" opacity=".72"/>
      <circle cx="49" cy="35" r="1.8" fill="white"/>
    </svg>
    {!compact && <div><strong>BHUTAN CENTER</strong><span>OMG EXPERIENCE</span></div>}
  </div>;
}
