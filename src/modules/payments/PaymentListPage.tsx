import React, { useMemo } from 'react';
import { invoiceForPayment, paymentTypeLabel } from '../../components/CustomerTracking';
import { CustomerTracking, PaymentInvoice, PaymentTransaction } from '../../types';
import { ListPage } from '../../shared/ListPage';
import { StatusBadge } from '../../shared/StatusBadge';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  payments: PaymentTransaction[];
  trackings: CustomerTracking[];
  invoices: PaymentInvoice[];
  onOpenPayment: (paymentId: string) => void;
  onOpenBooking: (trackingId: string) => void;
  onOpenInvoice: (invoiceId: string) => void;
}

export function PaymentListPage({ payments, trackings, invoices, onOpenPayment, onOpenBooking, onOpenInvoice }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const trackingById = useMemo(() => Object.fromEntries(trackings.map((t) => [t.id, t])), [trackings]);

  return (
    <ListPage
      title="รับชำระเงิน"
      rows={[...payments].sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))}
      getRowId={(p) => p.id}
      searchPlaceholder="ค้นหา RC no., reference, ลูกค้า..."
      searchKeys={[(p) => p.receiptNo || '', 'reference', (p) => trackingById[p.trackingId]?.customerName || '']}
      onRowClick={(p) => onOpenPayment(p.id)}
      columns={[
        { key: 'rc', header: 'ใบเสร็จ', render: (p) => <strong className="mono">{p.receiptNo || '—'}</strong> },
        {
          key: 'bk',
          header: 'BK',
          render: (p) => {
            const bk = trackingById[p.trackingId]?.bookingNo;
            if (!bk) return '—';
            return (
              <button type="button" className="bo-breadcrumb-link mono" onClick={(e) => { e.stopPropagation(); onOpenBooking(p.trackingId); }}>
                {bk}
              </button>
            );
          },
        },
        {
          key: 'inv',
          header: 'INV',
          render: (p) => {
            const inv = invoiceForPayment(p, invoices);
            if (!inv) return '—';
            return (
              <button type="button" className="bo-breadcrumb-link mono" onClick={(e) => { e.stopPropagation(); onOpenInvoice(inv.id); }}>
                {inv.invoiceNo}
              </button>
            );
          },
        },
        { key: 'customer', header: 'ลูกค้า', render: (p) => trackingById[p.trackingId]?.customerName || '—' },
        { key: 'type', header: 'ประเภท', render: (p) => <StatusBadge status={p.type} label={paymentTypeLabel(p.type, th)} /> },
        { key: 'amount', header: 'ยอด', render: (p) => formatTHB(p.amount, language) },
        { key: 'ref', header: 'อ้างอิง', render: (p) => p.reference || '—' },
        { key: 'date', header: 'วันที่', render: (p) => formatDate(p.paidAt, language) },
      ]}
    />
  );
}
