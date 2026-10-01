import React from 'react';
import { Pencil, Printer } from 'lucide-react';
import { QuotationDocument, printQuotation } from '../../components/QuotationDocument';
import { DetailHeader } from '../../shared/DetailHeader';
import { SectionCard, SummaryCard } from '../../shared/ui';
import { QuotationRecord } from '../../types';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  quotation: QuotationRecord;
  onBack: () => void;
  onEditPricing: () => void;
  onConvert?: () => void;
}

function dash(value: string) {
  return value.trim() || '—';
}

export function QuotationDetailPage({ quotation, onBack, onEditPricing, onConvert }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const isAgent = quotation.channel === 'agent';
  const canConvert = Boolean(quotation.customerName.trim());
  const convertHint = th ? 'กด แก้ไข เพื่อเพิ่มชื่อลูกค้า' : 'Click Edit to add customer name';

  const customerRows = isAgent
    ? [
        { label: th ? 'เอเจนต์ / บริษัท' : 'Agent / company', value: dash(quotation.agentName || quotation.customerName) },
        { label: th ? 'โทรศัพท์' : 'Phone', value: dash(quotation.phone) },
        { label: th ? 'อีเมล' : 'Email', value: dash(quotation.email) },
        { label: th ? 'ที่อยู่ออกใบแจ้งหนี้' : 'Invoice address', value: dash(quotation.invoiceAddress) },
      ]
    : [
        { label: th ? 'ชื่อลูกค้า' : 'Customer name', value: dash(quotation.customerName) },
        { label: th ? 'โทรศัพท์' : 'Phone', value: dash(quotation.phone) },
        { label: th ? 'อีเมล' : 'Email', value: dash(quotation.email) },
        { label: th ? 'ที่อยู่ออกใบแจ้งหนี้' : 'Invoice address', value: dash(quotation.invoiceAddress) },
      ];

  if (quotation.note.trim()) {
    customerRows.push({ label: th ? 'หมายเหตุ' : 'Note', value: quotation.note });
  }

  return (
    <div className="module-detail-page bo-detail-page">
      <DetailHeader
        breadcrumb={[{ label: th ? 'ใบเสนอราคา' : 'Quotations', onClick: onBack }, { label: quotation.quotationNo }]}
        docNo={quotation.quotationNo}
        title={quotation.customerName || (th ? 'ใบเสนอราคา' : 'Quotation')}
        subtitle={`${quotation.packageName} · ${quotation.passengerCount} pax`}
        status={quotation.status}
        onBack={onBack}
        actions={(
          <>
            <button type="button" className="ghost-button" onClick={() => { void printQuotation(quotation); }}>
              <Printer />
              <span>{th ? 'พิมพ์ / PDF' : 'Print / PDF'}</span>
            </button>
            <button type="button" className="ghost-button" onClick={onEditPricing}>
              <Pencil />
              <span>{th ? 'แก้ไข' : 'Edit'}</span>
            </button>
            {onConvert && quotation.status !== 'converted' && (
              <span className="detail-action-wrap" title={!canConvert ? convertHint : undefined}>
                <button type="button" className="primary-btn" disabled={!canConvert} onClick={onConvert}>
                  {th ? 'แปลงเป็น Booking' : 'Convert to Booking'}
                </button>
              </span>
            )}
          </>
        )}
      />
      <div className="bo-detail-grid">
        <div className="bo-detail-main">
          <SectionCard title={th ? 'เอกสารใบเสนอราคา' : 'Quotation document'}>
            <QuotationDocument quotation={quotation} />
          </SectionCard>
        </div>
        <aside className="bo-detail-rail">
          <SummaryCard title={th ? 'ลูกค้า' : 'Customer'} rows={customerRows} />
          <SummaryCard
            title={th ? 'สรุป' : 'Summary'}
            rows={[
              { label: th ? 'ยอดรวม' : 'Total', value: formatTHB(quotation.totalAmount, language), strong: true },
              { label: th ? 'สถานะ' : 'Status', value: quotation.status },
              { label: th ? 'สร้างโดย' : 'Created by', value: quotation.createdByName },
              { label: th ? 'วันที่' : 'Date', value: formatDate(quotation.createdAt, language) },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
