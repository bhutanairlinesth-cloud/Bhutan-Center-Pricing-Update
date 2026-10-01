import React from 'react';
import { Agent, QuotationRecord } from '../types';

export interface QuotationCustomerFields {
  customerName: string;
  phone: string;
  email: string;
  invoiceAddress: string;
  note: string;
  agentId: string;
  agentName: string;
}

export function emptyCustomerFields(): QuotationCustomerFields {
  return {
    customerName: '',
    phone: '',
    email: '',
    invoiceAddress: '',
    note: '',
    agentId: '',
    agentName: '',
  };
}

export function customerFieldsFromQuotation(q: QuotationRecord): QuotationCustomerFields {
  return {
    customerName: q.customerName,
    phone: q.phone,
    email: q.email,
    invoiceAddress: q.invoiceAddress,
    note: q.note,
    agentId: q.agentId || '',
    agentName: q.agentName || '',
  };
}

export function applyAgentToCustomer(
  draft: QuotationCustomerFields,
  agent: Agent | undefined,
): QuotationCustomerFields {
  if (!agent) return { ...draft, agentId: '', agentName: '' };
  return {
    ...draft,
    agentId: agent.id,
    agentName: agent.name,
    customerName: agent.name,
    phone: draft.phone || agent.phone,
    email: draft.email || agent.email,
  };
}
import { useI18n } from '../i18n';
import { formatDate, formatNumber } from '../utils/format';
import { printElementAsA4 } from '../utils/printA4';
import { Brand } from './Brand';

function formatTravelPeriod(value: string, nights: number, language: 'th' | 'en'): string {
  if (!value) return '-';
  const start = new Date(`${value}T12:00:00`);
  if (Number.isNaN(start.getTime())) return '-';
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, nights));
  const formatter = new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const period = `${formatter.format(start)} - ${formatter.format(end)}`;
  return language === 'en' ? period.toUpperCase() : period;
}

export function printQuotation(quotation: QuotationRecord) {
  const label = quotation.customerName
    ? `${quotation.quotationNo} - ${quotation.customerName}`
    : quotation.quotationNo;
  return printElementAsA4('quotation-print-area', label);
}

export function QuotationDocument({ quotation }: { quotation: QuotationRecord }) {
  const { t, language } = useI18n();
  const result = quotation.pricingResult;
  const issued = new Date(quotation.createdAt);
  const hotelLevelLabel = language === 'th'
    ? result.hotelCategory.replace(/\s*Stars?/i, ' ดาว')
    : result.hotelCategory;
  const includedItems = language === 'th'
    ? [
        'ตั๋วเครื่องบินไป–กลับ ชั้นประหยัด (Economy Class)',
        `ที่พักโรงแรมระดับ ${hotelLevelLabel}`,
        'อาหารทุกมื้อ: อาหารเช้าและอาหารเย็นที่โรงแรม และอาหารกลางวันที่ร้านอาหารท้องถิ่น',
        'ไกด์ท้องถิ่นที่สื่อสารภาษาอังกฤษและร่วมเดินทางตลอดทริป',
        'ค่าภาษีและค่าธรรมเนียมรายวันของรัฐบาล (SDF)',
        'ค่าธรรมเนียมเข้าสถานที่ท่องเที่ยวและอนุสรณ์สถานตามโปรแกรม',
        'ค่าธรรมเนียมวีซ่าประเทศภูฏาน',
        'รถรับส่งส่วนตัวตามที่ระบุไว้ในโปรแกรม',
        'โปรแกรมท่องเที่ยวและสถานที่ท่องเที่ยวตามกำหนดการ',
        'บริการรับ–ส่งที่สนามบินพาโร',
        'ประกันการเดินทางแบบระบุวัน',
      ]
    : [
        'Round-trip economy class airfare',
        `${hotelLevelLabel} hotel accommodation`,
        'All meals: breakfast and dinner at the hotel, and lunch at local restaurants',
        'English-speaking local guide travelling with the group throughout the trip',
        'Government Sustainable Development Fee (SDF)',
        'Admission fees for attractions and monuments listed in the itinerary',
        'Bhutan visa fee',
        'Private transfers as specified in the itinerary',
        'Tour programme and sightseeing as scheduled',
        'Paro Airport arrival and departure transfers',
        'Travel insurance covering the stated travel dates',
      ];
  const excludedItems = language === 'th'
    ? [
        'ค่าเช่าม้าขึ้นวัดทักซัง',
        'ค่าทิปไกด์ 3 USD และคนขับรถ 2 USD รวม 5 USD ต่อคน/วัน',
        'ค่าใช้จ่ายส่วนตัวหรือรายการอื่นนอกเหนือจากโปรแกรม',
      ]
    : [
        'Horse rental for the Tiger’s Nest hike',
        'Tips: USD 3 for the guide and USD 2 for the driver, total USD 5 per person/day',
        'Personal expenses and any services not specified in the itinerary',
      ];

  return (
    <article className="quotation-sheet" id="quotation-print-area">
      <header className="quote-header">
        <div><Brand/><p>Travel design · Flights · Bhutan experiences</p></div>
        <div className="quote-title"><span>{result.channel === 'retail' ? 'RETAIL' : 'AGENT'}</span><h1>{t('quotation')}</h1><b>{quotation.quotationNo}</b></div>
      </header>
      <div className="quote-accent"/>
      <section className="quote-meta-grid">
        <div>
          <span>{t('preparedFor')}</span>
          <strong>{quotation.customerName || '-'}</strong>
          <small>{[quotation.phone, quotation.email].filter(Boolean).join(' · ') || '-'}</small>
          {quotation.invoiceAddress && <small className="quote-address">{quotation.invoiceAddress}</small>}
        </div>
        <div>
          <span>{t('issueDate')}</span>
          <strong>{formatDate(issued, language)}</strong>
          <small>{t('preparedBy')}: {quotation.createdByName}</small>
        </div>
      </section>
      <section className="quote-trip-card">
        <div><span>{t('package')}</span><strong>{result.packageName}</strong></div>
        <div><span>{t('travelDate')}</span><strong>{result.travelDate ? formatDate(result.travelDate, language) : '-'}</strong></div>
        <div><span>{t('hotelLevel')}</span><strong>{result.hotelCategory}</strong><small>{result.nights} {t('nights')}</small></div>
        <div><span>{t('passengers')}</span><strong>{result.passengerCount} {t('people')}</strong><small>{result.pricingMode === 'group_tl' ? (language === 'th' ? `เรียกเก็บ ${result.chargeablePassengerCount} · TL ${result.tourLeaderCount}` : `${result.chargeablePassengerCount} billed · ${result.tourLeaderCount} TL`) : result.childPassengerCount > 0 ? (language === 'th' ? `${result.adultPassengerCount} ผู้ใหญ่ · ${result.childPassengerCount} เด็ก` : `${result.adultPassengerCount} adults · ${result.childPassengerCount} children`) : `${result.nights} ${t('nights')}`}</small></div>
      </section>
      <section className="quote-price-table quote-passenger-table">
        <div className="quote-table-head quote-six-columns">
          <span>{language === 'th' ? 'รายการผู้โดยสาร / บริการ' : 'Passenger / Service'}</span>
          <span>PTC</span>
          <span>{language === 'th' ? 'จำนวน' : 'QTY'}</span>
          <span>{language === 'th' ? 'ราคาขาย / ท่าน' : 'Selling / Pax'}</span>
          <span>{language === 'th' ? 'เพิ่มเติม' : 'Additional'}</span>
          <span>{language === 'th' ? 'รวม (บาท)' : 'Total (THB)'}</span>
        </div>
        {result.adultPassengerCount > 0 && <div className="quote-table-row quote-six-columns quote-passenger-row">
          <span className="quote-service-cell">
            <b className="quote-travel-period">{formatTravelPeriod(result.travelDate, result.nights, language)}</b>
            <strong>{language === 'th' ? `แพ็กเกจ ${result.nights + 1} วัน ${result.nights} คืน โรงแรม ${result.hotelCategory}` : `Package ${result.nights + 1}D${result.nights}N ${result.hotelCategory} Hotel`}</strong>
            <small>{result.packageName}{result.hasGroupFlightDiscount ? ` · ${t('groupDiscount')} ${formatNumber(result.groupDiscountPercentApplied, 2)}%` : ''}</small>
          </span>
          <span className="quote-center-cell"><b>ADT</b></span><span className="quote-center-cell"><b>{result.pricingMode === 'group_tl' ? result.chargeablePassengerCount : result.adultPassengerCount}</b></span>
          <span className="quote-number-cell"><b>{formatNumber(result.sellingPricePerPerson, 2)}</b></span><span className="quote-number-cell"><b>—</b></span>
          <span className="quote-number-cell quote-line-total"><b>{formatNumber(result.pricingMode === 'group_tl' ? result.groupSubtotal : result.adultSubtotal, 2)}</b></span>
        </div>}
        {result.childPassengerCount > 0 && <div className="quote-table-row quote-six-columns quote-passenger-row quote-child-row">
          <span className="quote-service-cell"><strong>{language === 'th' ? `แพ็กเกจเด็ก ${result.nights + 1} วัน ${result.nights} คืน` : `Child package ${result.nights + 1}D${result.nights}N`}</strong><small>{result.hotelCategory} · {result.packageName}</small></span>
          <span className="quote-center-cell"><b>CHD</b></span><span className="quote-center-cell"><b>{result.childPassengerCount}</b></span>
          <span className="quote-number-cell"><b>{formatNumber(result.childSellingPricePerPerson, 2)}</b></span><span className="quote-number-cell"><b>—</b></span>
          <span className="quote-number-cell quote-line-total"><b>{formatNumber(result.childSubtotal, 2)}</b></span>
        </div>}
        {result.businessUpgradeCount > 0 && <div className="quote-table-row quote-six-columns quote-passenger-row quote-extra-row">
          <span className="quote-service-cell"><strong>Business Class Upgrade</strong><small>{result.pricingMode === 'group_tl'
            ? (language === 'th' ? `${result.businessUpgradeCount} ท่าน จากผู้เดินทางจริง ${result.passengerCount} ท่าน` : `${result.businessUpgradeCount} of ${result.passengerCount} actual travellers`)
            : (language === 'th' ? 'อัปเกรดชั้นโดยสาร' : 'Cabin upgrade')}</small></span>
          <span className="quote-center-cell"><b>ADT</b></span><span className="quote-center-cell"><b>{result.businessUpgradeCount}</b></span>
          <span className="quote-number-cell"><b>{formatNumber(result.businessUpgradePerPerson, 2)}</b></span><span className="quote-number-cell"><b>—</b></span>
          <span className="quote-number-cell quote-line-total"><b>{formatNumber(result.businessUpgradeTotal, 2)}</b></span>
        </div>}
        {result.additionalItems.map((item) => <div className="quote-table-row quote-six-columns quote-passenger-row quote-extra-row" key={item.id}>
          <span className="quote-service-cell"><strong>{item.description || (language === 'th' ? 'รายการเพิ่มเติม' : 'Additional service')}</strong><small>{item.basis === 'per_person' ? (language === 'th' ? 'คิดต่อท่าน' : 'Per person') : item.basis === 'per_group' ? (language === 'th' ? 'เหมาทั้งกลุ่ม' : 'Per group') : (language === 'th' ? 'จำนวนกำหนดเอง' : 'Custom quantity')}</small></span>
          <span className="quote-center-cell"><b>SRV</b></span><span className="quote-center-cell"><b>{formatNumber(item.quantity, 0)}</b></span>
          <span className="quote-number-cell"><b>{formatNumber(item.unitPriceTHB, 2)}</b></span><span className="quote-number-cell"><b>—</b></span>
          <span className="quote-number-cell quote-line-total"><b>{formatNumber(item.totalTHB, 2)}</b></span>
        </div>)}
        {result.singleRoomCount > 0 && <div className="quote-table-row quote-six-columns quote-passenger-row quote-single-room-row">
          <span className="quote-service-cell"><strong>{language === 'th' ? 'ส่วนต่างห้องพักเดี่ยว' : 'Single-room supplement'}</strong><small>{result.hotelCategory} · {result.nights} {t('nights')}</small></span>
          <span className="quote-center-cell"><b>ADT</b></span>
          <span className="quote-center-cell"><b>{result.singleRoomCount}</b></span>
          <span className="quote-number-cell"><b>{formatNumber(result.singleSupplementPerPerson, 2)}</b></span>
          <span className="quote-number-cell"><b>—</b></span>
          <span className="quote-number-cell quote-line-total"><b>{formatNumber(result.singleSupplementTotal, 2)}</b></span>
        </div>}
        <div className="quote-table-grand-total">
          <span>{language === 'th' ? 'ยอดรวมสุทธิ' : 'Grand Total'}</span>
          <strong>THB {formatNumber(result.groupTotal, 2)}</strong>
        </div>
      </section>
      {result.pricingMode === 'group_tl' && <section className="quote-group-tl-note">
        <strong>{language === 'th' ? `เงื่อนไขกรุ๊ป ${result.chargeablePassengerCount}+${result.tourLeaderCount} TL` : `Group arrangement ${result.chargeablePassengerCount}+${result.tourLeaderCount} TL`}</strong>
        <span>{language === 'th'
          ? `เดินทางจริง ${result.passengerCount} ท่าน เรียกเก็บราคาเฉลี่ย ${result.chargeablePassengerCount} ท่าน โดย Tour Leader ${result.tourLeaderCount} ท่านได้รับยกเว้นเฉพาะค่าที่พัก ส่วนตั๋วเครื่องบิน ภาษี SDF วีซ่า และค่าใช้จ่ายที่เกี่ยวข้องยังรวมครบตามจำนวนผู้เดินทางจริง`
          : `${result.passengerCount} actual travellers; pricing is averaged across ${result.chargeablePassengerCount} paying travellers. ${result.tourLeaderCount} tour leader(s) receive complimentary hotel only; airfare, airport tax, SDF, visa and related costs remain included for every actual traveller.`}</span>
        {(result.businessUpgradeTotal > 0 || result.singleSupplementTotal > 0 || result.additionalItemsTotal > 0) && <small>{language === 'th' ? 'ราคาแพ็กเกจพื้นฐานคิดเฉพาะผู้ชำระ ส่วน Business Class พักเดี่ยว และรายการเพิ่มเติมแสดงแยกตามจำนวนผู้ใช้บริการจริงภายในผู้เดินทางทั้งหมด' : 'The base package is billed to paying travellers; Business Class, single-room and other services are shown separately for the actual travellers who use them.'}</small>}
      </section>}
      <section className="quote-scope-grid">
        <div className="quote-scope-card quote-included">
          <h3>{language === 'th' ? 'ราคารวม' : 'Package Includes'}</h3>
          <ol>{includedItems.map((item, index) => <li key={`included-${index}`}>{item}</li>)}</ol>
        </div>
        <div className="quote-scope-card quote-excluded">
          <h3>{language === 'th' ? 'ราคาไม่รวม' : 'Package Excludes'}</h3>
          <ul>{excludedItems.map((item, index) => <li key={`excluded-${index}`}>{item}</li>)}</ul>
        </div>
      </section>
      {quotation.note && <section className="quote-total-area quote-total-area-simple">
        <div className="quote-note"><span>{t('note')}</span><p>{quotation.note}</p></div>
      </section>}
      <section className="quote-terms"><h3>{t('terms')}</h3><ol><li>{t('term1')}</li><li>{t('term2')}</li><li>{t('term3')}</li></ol></section>
      <footer className="quote-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div className="quote-sign"><span>Authorized signature</span></div></footer>
    </article>
  );
}
