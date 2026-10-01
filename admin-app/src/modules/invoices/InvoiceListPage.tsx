import React, { useMemo } from 'react';
import { CustomerTracking, PaymentInvoice } from '../../types';
import { ListPage } from '../../shared/ListPage';
import { StatusBadge, statusLabel } from '../../shared/StatusBadge';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  invoices: PaymentInvoice[];
  trackings: CustomerTracking[];
  onOpenInvoice: (invoiceId: string) => void;
  onOpenBooking: (trackingId: string) => void;
}

export function InvoiceListPage({ invoices, trackings, onOpenInvoice, onOpenBooking }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const trackingById = useMemo(() => Object.fromEntries(trackings.map((t) => [t.id, t])), [trackings]);

  return (
    <ListPage
      title="ใบแจ้งหนี้"
      rows={[...invoices].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))}
      getRowId={(inv) => inv.id}
      searchPlaceholder="ค้นหา INV no., ลูกค้า..."
      searchKeys={[(inv) => inv.invoiceNo, (inv) => trackingById[inv.trackingId]?.customerName || '']}
      statusFilter={[
        { key: 'pending', label: statusLabel('pending', th), match: (inv) => inv.status === 'pending' },
        { key: 'invoiced', label: statusLabel('invoiced', th), match: (inv) => inv.status === 'invoiced' },
        { key: 'paid', label: statusLabel('paid', th), match: (inv) => inv.status === 'paid' },
        { key: 'overdue', label: statusLabel('overdue', th), match: (inv) => inv.status === 'overdue' },
      ]}
      onRowClick={(inv) => onOpenInvoice(inv.id)}
      columns={[
        { key: 'no', header: 'เลขที่', render: (inv) => <strong className="mono">{inv.invoiceNo}</strong> },
        {
          key: 'bk',
          header: 'BK',
          render: (inv) => {
            const bk = trackingById[inv.trackingId]?.bookingNo;
            if (!bk) return '—';
            return (
              <button
                type="button"
                className="bo-breadcrumb-link mono"
                onClick={(e) => { e.stopPropagation(); onOpenBooking(inv.trackingId); }}
              >
                {bk}
              </button>
            );
          },
        },
        { key: 'customer', header: 'ลูกค้า', render: (inv) => trackingById[inv.trackingId]?.customerName || '—' },
        { key: 'type', header: 'งวด', render: (inv) => <StatusBadge status={inv.installment} /> },
        { key: 'amount', header: 'ยอด', render: (inv) => formatTHB(inv.amount, language) },
        { key: 'status', header: 'สถานะ', render: (inv) => <StatusBadge status={inv.status} /> },
        { key: 'date', header: 'วันที่', render: (inv) => formatDate(inv.issueDate, language) },
      ]}
    />
  );
}
