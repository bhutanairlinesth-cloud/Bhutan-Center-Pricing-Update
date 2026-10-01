import React from 'react';
import { ChevronRight } from 'lucide-react';

export function PageHeader({
  breadcrumb = [],
  title,
  subtitle,
  badge,
  onBack,
  actions,
}: {
  breadcrumb?: { label: string; href?: string; onClick?: () => void }[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bo-page-header">
      {breadcrumb.length > 0 && (
        <nav className="bo-breadcrumb" aria-label="Breadcrumb">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={`${item.label}-${i}`}>
              {i > 0 && <ChevronRight size={14} aria-hidden />}
              {item.onClick || item.href ? (
                <button type="button" className="bo-breadcrumb-link" onClick={item.onClick}>
                  {item.label}
                </button>
              ) : (
                <span className="bo-breadcrumb-current">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="bo-page-header-row">
        <div className="bo-page-header-main">
          {onBack && (
            <button type="button" className="bo-back-btn" onClick={onBack} aria-label="Back">
              ←
            </button>
          )}
          <div>
            <div className="bo-page-header-title-row">
              <h1 className="bo-page-title">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="bo-page-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="bo-page-header-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionCard({
  title,
  actions,
  children,
  className = '',
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const hasHead = Boolean(title) || Boolean(actions);
  return (
    <section className={`bo-section-card ${className}`.trim()}>
      {hasHead && (
        <div className="bo-section-card-head">
          {title ? <h2 className="bo-section-card-title">{title}</h2> : <span />}
          {actions && <div className="bo-section-card-actions">{actions}</div>}
        </div>
      )}
      <div className="bo-section-card-body">{children}</div>
    </section>
  );
}

export function FieldGrid({
  cols = 2,
  children,
  className = '',
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bo-field-grid cols-${cols} ${className}`.trim()}>{children}</div>;
}

export function SummaryCard({
  title,
  rows,
  children,
}: {
  title: string;
  rows?: { label: string; value: React.ReactNode; strong?: boolean }[];
  children?: React.ReactNode;
}) {
  return (
    <aside className="bo-summary-card">
      <h3 className="bo-summary-card-title">{title}</h3>
      {rows && (
        <dl className="bo-summary-rows">
          {rows.map((row) => (
            <div key={String(row.label)} className="bo-summary-row">
              <dt>{row.label}</dt>
              <dd className={row.strong ? 'strong' : ''}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </aside>
  );
}

export function FormActionBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <footer className={`bo-form-action-bar ${className}`.trim()}>{children}</footer>;
}

export function Toggle({ checked, onChange, label, ariaLabel, disabled }: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`bo-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="bo-toggle-track"><span className="bo-toggle-knob" /></span>
      {label && <span className="bo-toggle-text">{label}</span>}
    </button>
  );
}
