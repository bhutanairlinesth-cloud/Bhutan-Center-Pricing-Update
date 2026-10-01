import React from 'react';
import { FileText } from 'lucide-react';
import { QuotationRecord } from '../../types';
import { ListPage } from '../../shared/ListPage';
import { StatusBadge, statusLabel } from '../../shared/StatusBadge';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  quotations: QuotationRecord[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onOpenAgentRateSheet?: () => void;
}

export function QuotationListPage({ quotations, onOpen, onCreate, onOpenAgentRateSheet }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  return (
    <ListPage
      title="ใบเสนอราคา"
      headerActions={onOpenAgentRateSheet ? (
        <button type="button" className="secondary-button" onClick={onOpenAgentRateSheet}>
          <FileText size={16} />ใบราคา Agent
        </button>
      ) : undefined}
      rows={[...quotations].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))}
      getRowId={(q) => q.id}
      searchPlaceholder="ค้นหาเลขที่ QT, ชื่อลูกค้า, โปรแกรม..."
      searchKeys={[(q) => q.quotationNo, 'customerName', 'packageName', 'phone']}
      statusFilter={[
        { key: 'sent', label: statusLabel('sent', th), match: (q) => q.status === 'sent' },
        { key: 'confirmed', label: statusLabel('confirmed', th), match: (q) => q.status === 'confirmed' },
        { key: 'converted', label: statusLabel('converted', th), match: (q) => q.status === 'converted' },
        { key: 'lost', label: statusLabel('lost', th), match: (q) => q.status === 'lost' },
      ]}
      onRowClick={(q) => onOpen(q.id)}
      onCreate={onCreate}
      createLabel="สร้างใบเสนอราคา"
      columns={[
        { key: 'no', header: 'เลขที่', render: (q) => <strong className="mono">{q.quotationNo}</strong> },
        { key: 'customer', header: 'ลูกค้า', render: (q) => q.customerName || '-' },
        { key: 'package', header: 'โปรแกรม', render: (q) => <span className="truncate-cell">{q.packageName}</span> },
        { key: 'amount', header: 'ยอด', render: (q) => formatTHB(q.totalAmount, language) },
        { key: 'status', header: 'สถานะ', render: (q) => <StatusBadge status={q.status} /> },
        { key: 'date', header: 'วันที่', render: (q) => formatDate(q.createdAt, language) },
      ]}
    />
  );
}
