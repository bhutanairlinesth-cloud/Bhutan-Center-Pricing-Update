import React from 'react';
import { getJourneyStage, stageTagKey } from '../../components/CustomerTracking';
import { CustomerTracking } from '../../types';
import { ListPage } from '../../shared/ListPage';
import { StatusBadge, statusLabel } from '../../shared/StatusBadge';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  trackings: CustomerTracking[];
  onOpen: (id: string) => void;
  onCreate: () => void;
}

export function BookingListPage({ trackings, onOpen, onCreate }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  return (
    <ListPage
      title="การจอง"
      rows={[...trackings].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))}
      getRowId={(b) => b.id}
      searchPlaceholder="ค้นหา BK no., ชื่อลูกค้า, PNR, โปรแกรม..."
      searchKeys={[(b) => b.bookingNo || '', 'customerName', 'opportunityName', 'flightPnr', 'packageName', 'phone']}
      statusFilter={[
        { key: 'new', label: statusLabel('new', th), match: (b) => b.status === 'new' },
        { key: 'following', label: statusLabel('following', th), match: (b) => b.status === 'following' },
        { key: 'won', label: statusLabel('won', th), match: (b) => b.status === 'won' },
        { key: 'lost', label: statusLabel('lost', th), match: (b) => b.status === 'lost' },
        { key: 'completed', label: statusLabel('completed', th), match: (b) => b.status === 'completed' },
      ]}
      onRowClick={(b) => onOpen(b.id)}
      onCreate={onCreate}
      createLabel="สร้างการจองใหม่"
      columns={[
        { key: 'no', header: 'เลขที่', render: (b) => <strong className="mono">{b.bookingNo || '—'}</strong> },
        { key: 'customer', header: 'ลูกค้า', render: (b) => b.customerName || b.opportunityName || '-' },
        { key: 'package', header: 'โปรแกรม', render: (b) => <span className="truncate-cell">{b.packageName}</span> },
        { key: 'travel', header: 'เดินทาง', render: (b) => b.travelStartDate ? formatDate(b.travelStartDate, language) : '—' },
        { key: 'amount', header: 'ยอด', render: (b) => formatTHB(b.grandTotalAmount || b.totalAmount, language) },
        { key: 'status', header: 'สถานะ', render: (b) => (
          <span className="bo-tag-row">
            <StatusBadge status={stageTagKey(getJourneyStage(b))} />
            <StatusBadge status={b.status} />
          </span>
        ) },
      ]}
    />
  );
}
