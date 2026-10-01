import React from 'react';
import { useI18n } from '../i18n';

export type TagTone = 'green' | 'amber' | 'blue' | 'red' | 'slate' | 'violet' | 'orange' | 'indigo' | 'purple' | 'pink';

type StatusMeta = { tone: TagTone; th: string; en: string };

export const STATUS_META: Record<string, StatusMeta> = {
  // TrackingStatus
  new: { tone: 'slate', th: 'ลูกค้าใหม่', en: 'New lead' },
  following: { tone: 'amber', th: 'กำลังติดตาม', en: 'Following' },
  quote_sent: { tone: 'blue', th: 'ส่งใบเสนอราคาแล้ว', en: 'Quote sent' },
  won: { tone: 'green', th: 'ยืนยันจอง', en: 'Booking confirmed' },
  lost: { tone: 'red', th: 'ยกเลิก', en: 'Lost' },
  completed: { tone: 'slate', th: 'ปิดจบงาน', en: 'Closed' },
  // PaymentStageStatus
  pending: { tone: 'amber', th: 'รอดำเนินการ', en: 'Pending' },
  invoiced: { tone: 'blue', th: 'ออก Invoice แล้ว', en: 'Invoiced' },
  paid: { tone: 'green', th: 'ชำระแล้ว', en: 'Paid' },
  overdue: { tone: 'red', th: 'เกินกำหนด', en: 'Overdue' },
  cancelled: { tone: 'red', th: 'ยกเลิก', en: 'Cancelled' },
  // InvoiceInstallment
  deposit: { tone: 'orange', th: 'Invoice 1 · ค่าตั๋ว', en: 'Invoice 1 · ticket' },
  balance: { tone: 'indigo', th: 'Invoice 2 · ค่าแพ็กเกจ', en: 'Invoice 2 · package' },
  full: { tone: 'purple', th: 'ชำระเต็มจำนวน', en: 'Full payment' },
  supplemental: { tone: 'pink', th: 'Invoice เพิ่มเติม', en: 'Supplemental invoice' },
  // PaymentTransactionType
  ticket_deposit: { tone: 'orange', th: 'ค่าตั๋ว / งวดที่ 1', en: 'Ticket / stage 1' },
  package_balance: { tone: 'indigo', th: 'ค่าแพ็กเกจ / งวดที่ 2', en: 'Package / stage 2' },
  full_payment: { tone: 'purple', th: 'ชำระเต็มจำนวนครั้งเดียว', en: 'One-time full payment' },
  refund: { tone: 'red', th: 'คืนเงิน', en: 'Refund' },
  other: { tone: 'slate', th: 'อื่น ๆ', en: 'Other' },
  // QuotationStatus
  sent: { tone: 'blue', th: 'ส่งแล้ว', en: 'Sent' },
  confirmed: { tone: 'green', th: 'ยืนยันแล้ว', en: 'Confirmed' },
  converted: { tone: 'violet', th: 'แปลงเป็นการจอง', en: 'Converted' },
  // Journey stage groups
  sales: { tone: 'blue', th: 'เสนอราคา', en: 'Quotation' },
  booking: { tone: 'orange', th: 'จองตั๋ว / งวด 1', en: 'Flight / payment 1' },
  visa: { tone: 'indigo', th: 'วีซ่า / งวด 2', en: 'Visa / payment 2' },
  travel: { tone: 'green', th: 'พร้อมเดินทาง', en: 'Ready to travel' },
  after: { tone: 'slate', th: 'หลังเดินทาง', en: 'Post-trip' },
  closed: { tone: 'slate', th: 'ปิดงาน', en: 'Closed' },
  // Payment summary rollup
  partial: { tone: 'amber', th: 'ชำระบางส่วน', en: 'Partially paid' },
};

export function statusLabel(key: string, th: boolean): string {
  const meta = STATUS_META[key];
  if (meta) return th ? meta.th : meta.en;
  return key.replace(/_/g, ' ');
}

export function statusTone(key: string): TagTone {
  return STATUS_META[key]?.tone ?? 'slate';
}

export function StatusBadge({ status, label, className = '' }: { status: string; label?: string; className?: string }) {
  const { language } = useI18n();
  const th = language === 'th';
  const meta = STATUS_META[status];
  const tone = meta?.tone ?? 'unknown';
  const text = label ?? statusLabel(status, th);
  return (
    <span className={`bo-tag bo-tag--${tone} ${className}`.trim()}>
      {text}
    </span>
  );
}
