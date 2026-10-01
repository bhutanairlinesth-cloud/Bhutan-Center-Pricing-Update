import React from 'react';
import { StatusBadge } from './StatusBadge';
import { PageHeader } from './ui';

interface Props {
  docNo?: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; onClick?: () => void }[];
}

export function DetailHeader({ docNo, title, subtitle, status, statusLabel, onBack, actions, breadcrumb }: Props) {
  return (
    <PageHeader
      breadcrumb={breadcrumb}
      onBack={onBack}
      title={(
        <>
          {docNo && <span className="module-doc-no">{docNo} · </span>}
          {title}
        </>
      )}
      subtitle={subtitle}
      badge={status ? <StatusBadge status={status} label={statusLabel} /> : undefined}
      actions={actions}
    />
  );
}
