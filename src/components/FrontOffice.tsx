import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgePercent, BriefcaseBusiness, Building2, CalendarDays, Check,
  ChevronDown, CircleDollarSign, FileText, Hotel as HotelIcon, LogOut, Plane,
  Settings2, ShieldCheck, Sparkles, Users, WalletCards,
} from 'lucide-react';
import { CustomerDetails, GlobalSettings, HotelCategory, PricingChannel, PricingInput, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { calculatePrice } from '../utils/pricing';
import { formatDate, formatNumber, formatTHB, formatUSD, makeQuotationNo } from '../utils/format';
import { Brand } from './Brand';
import { Modal } from './Ui';

interface FrontOfficeProps {
  settings: GlobalSettings;
  packages: TourPackage[];
  currentUser: User;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const emptyCustomer: CustomerDetails = { name: '', phone: '', email: '', note: '' };

export function FrontOffice({ settings, packages, currentUser, onOpenAdmin, onLogout }: FrontOfficeProps) {
  const { t, language } = useI18n();
  const firstPackage = packages[0];
  const firstCategory: HotelCategory = '3 Stars';
  const [input, setInput] = useState<PricingInput>({
    channel: 'retail',
    packageId: firstPackage?.id || '',
    passengerCount: 2,
    hotelCategory: firstCategory,
    travelDate: '',
    businessUpgradeCount: 0,
  });
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotationNo, setQuotationNo] = useState(makeQuotationNo());

  useEffect(() => {
    if (!input.packageId && packages[0]) setInput((value) => ({ ...value, packageId: packages[0].id }));
  }, [packages, input.packageId]);


  const result = useMemo(() => calculatePrice(input, settings, packages), [input, settings, packages]);
  const selectedPackage = packages.find((pkg) => pkg.id === input.packageId);
  const agentDiscount = settings.ticketPriceTHB > 0
    ? ((settings.ticketPriceTHB - (settings.agentTicketPriceTHB ?? 25220)) / settings.ticketPriceTHB) * 100
    : 0;
  const groupDiscountMinPax = Math.max(1, Math.round(settings.groupDiscountMinPax ?? 10));
  const groupDiscountPercent = Math.min(100, Math.max(0, settings.groupDiscountPercent ?? 10));
  const groupDiscountDisplay = formatNumber(groupDiscountPercent, Number.isInteger(groupDiscountPercent) ? 0 : 2);
  const groupDiscountLabel = language === 'th'
    ? `ลด ${groupDiscountDisplay}%`
    : `${groupDiscountDisplay}% off`;

  function update<K extends keyof PricingInput>(key: K, value: PricingInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function openQuotation() {
    setQuotationNo(makeQuotationNo());
    setCustomerOpen(false);
    setQuoteOpen(true);
  }

  return <div className="front-shell">
    <header className="front-header">
      <Brand/>
      <div className="front-header-actions">
        <LanguageSwitch compact/>
        <span className="user-chip"><i>{currentUser.name?.[0]?.toUpperCase() || 'U'}</i><span><b>{currentUser.name}</b><small>{currentUser.role}</small></span></span>
        {currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}
        <button className="icon-button" onClick={onLogout} title={t('logout')}><LogOut/></button>
      </div>
    </header>

    <main className="front-main">
      <section className="page-intro">
        <div><span className="eyebrow"><Sparkles/> LIVE PRICING</span><h1>{t('calculatorTitle')}</h1><p>{t('calculatorSubtitle')}</p></div>
        {currentUser.role === 'admin' && <button className="ghost-button mobile-admin" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}
      </section>

      <div className="calculator-layout">
        <section className="calculator-form-card">
          <div className="section-block">
            <div className="section-title"><span>01</span><div><h2>{t('channel')}</h2><p>Retail / Wholesale</p></div></div>
            <div className="channel-grid">
              <ChannelCard active={input.channel === 'retail'} channel="retail" title={t('retail')} detail={t('retailHint')} meta={`${formatTHB(settings.ticketPriceTHB, language)} · ${t('margin')} ${formatTHB(settings.marginTHB, language)}`} onClick={() => update('channel', 'retail')}/>
              <ChannelCard active={input.channel === 'agent'} channel="agent" title={t('agent')} detail={t('agentHint')} meta={`${formatTHB(settings.agentTicketPriceTHB ?? 25220, language)} · -${formatNumber(agentDiscount, 2)}%`} onClick={() => update('channel', 'agent')}/>
            </div>
          </div>

          <div className="section-divider"/>
          <div className="section-block">
            <div className="section-title"><span>02</span><div><h2>{t('tripDetails')}</h2><p>{packages.length} packages · 3 hotel levels</p></div></div>
            <div className="form-grid">
              <label className="field span-2"><span>{t('package')}</span><div className="select-wrap"><Plane/><select value={input.packageId} onChange={(event) => update('packageId', event.target.value)}>{packages.map((pkg) => <option value={pkg.id} key={pkg.id}>{pkg.name}</option>)}</select><ChevronDown/></div></label>
              <label className="field"><span>{t('passengers')}</span><div className="select-wrap"><Users/><select value={input.passengerCount} onChange={(event) => {
                const pax = Number(event.target.value); setInput((value) => ({ ...value, passengerCount: pax, businessUpgradeCount: Math.min(value.businessUpgradeCount, pax) }));
              }}>{Array.from({ length: 15 }, (_, index) => index + 1).map((pax) => <option value={pax} key={pax}>{pax} {t('people')}{pax >= groupDiscountMinPax && groupDiscountPercent > 0 ? ` · ${groupDiscountLabel}` : ''}</option>)}</select><ChevronDown/></div></label>
              <label className="field"><span>{t('travelDate')}</span><div className="input-with-icon simple"><CalendarDays/><input type="date" value={input.travelDate} onChange={(event) => update('travelDate', event.target.value)}/></div></label>
              <label className="field span-2"><span>{t('hotelLevel')}</span><div className="select-wrap"><Building2/><select value={input.hotelCategory} onChange={(event) => update('hotelCategory', event.target.value as HotelCategory)}><option value="3 Stars">3 Stars</option><option value="4 Stars">4 Stars</option><option value="5 Stars">5 Stars</option></select><ChevronDown/></div></label>
            </div>
          </div>

          <div className="upgrade-row">
            <div className="upgrade-icon"><BriefcaseBusiness/></div>
            <div className="upgrade-copy"><b>{t('businessUpgrade')}</b><span>{t('businessUpgradeHint')}</span></div>
            <div className="stepper"><button type="button" onClick={() => update('businessUpgradeCount', Math.max(0, input.businessUpgradeCount - 1))}>−</button><strong>{input.businessUpgradeCount}</strong><button type="button" onClick={() => update('businessUpgradeCount', Math.min(input.passengerCount, input.businessUpgradeCount + 1))}>+</button></div>
          </div>
        </section>

        <aside className="price-summary-card">
          <div className="summary-top"><span className={`channel-badge ${input.channel}`}>{input.channel === 'retail' ? t('retail') : t('agent')}</span><span className="live-dot"><i/> LIVE</span></div>
          <div className="summary-hero"><span>{t('perPerson')}</span><strong>{formatTHB(result?.sellingPricePerPerson || 0, language)}</strong><small>{selectedPackage?.nights || 0} {t('nights')} · {input.passengerCount} {t('people')}</small></div>
          <div className="summary-lines">
            <PriceLine icon={<Plane/>} label={t('flight')} value={formatTHB(result?.airTicketPerPerson || 0, language)} note={result?.hasGroupFlightDiscount ? groupDiscountLabel : undefined}/>
            <PriceLine icon={<WalletCards/>} label={t('airportTax')} value={formatTHB(result?.airportTaxPerPerson || 0, language)}/>
            <PriceLine icon={<HotelIcon/>} label={t('ground')} value={formatTHB(result?.groundCostTHBPerPerson || 0, language)} note={`${formatUSD(result?.groundRateUSDPerPersonPerNight || 0)} / night`}/>
            <PriceLine icon={<ShieldCheck/>} label={t('visa')} value={formatTHB(result?.visaTHBPerPerson || 0, language)} note={formatUSD(result?.visaUSDPerPerson || 0)}/>
          </div>
          <div className="profit-strip"><div><span>{t('cost')}</span><b>{formatTHB(result?.baseCostPerPerson || 0, language)}</b></div><div><span>{t('profit')}</span><b>{formatTHB(result?.profitPerPerson || 0, language)}</b></div></div>
          <div className="group-total"><span>{t('groupTotal')}</span><strong>{formatTHB(result?.groupTotal || 0, language)}</strong>{(result?.businessUpgradeTotal || 0) > 0 && <small>+ Business {formatTHB(result?.businessUpgradeTotal || 0, language)}</small>}</div>
          <button className="primary-button quote-button" disabled={!result} onClick={() => setCustomerOpen(true)}><FileText/><span>{t('createQuote')}</span><ArrowRight/></button>
          <div className="summary-foot"><CircleDollarSign/><span>1 USD = {formatNumber(settings.exchangeRateUSD, 2)} THB · Rounded up / 500 THB</span></div>
        </aside>
      </div>
    </main>

    <Modal open={customerOpen} title={t('customerInfo')} onClose={() => setCustomerOpen(false)}>
      <div className="customer-form">
        <label className="field"><span>{t('customerName')}</span><input value={customer.name} onChange={(event) => setCustomer((value) => ({ ...value, name: event.target.value }))} autoFocus/></label>
        <div className="form-grid">
          <label className="field"><span>{t('phone')}</span><input value={customer.phone} onChange={(event) => setCustomer((value) => ({ ...value, phone: event.target.value }))}/></label>
          <label className="field"><span>{t('email')}</span><input type="email" value={customer.email} onChange={(event) => setCustomer((value) => ({ ...value, email: event.target.value }))}/></label>
        </div>
        <label className="field"><span>{t('note')}</span><textarea rows={3} value={customer.note} onChange={(event) => setCustomer((value) => ({ ...value, note: event.target.value }))}/></label>
        <div className="modal-actions"><button className="ghost-button" onClick={() => setCustomerOpen(false)}>{t('cancel')}</button><button className="primary-button" onClick={openQuotation} disabled={!customer.name.trim()}>{t('continue')}<ArrowRight/></button></div>
      </div>
    </Modal>

    {result && <QuotationPreview open={quoteOpen} onClose={() => setQuoteOpen(false)} result={result} customer={customer} currentUser={currentUser} quotationNo={quotationNo}/>}    
  </div>;
}

function ChannelCard({ active, channel, title, detail, meta, onClick }: { active: boolean; channel: PricingChannel; title: string; detail: string; meta: string; onClick: () => void }) {
  return <button type="button" className={`channel-card ${channel} ${active ? 'active' : ''}`} onClick={onClick}>
    <span className="channel-check">{active && <Check/>}</span><div><b>{title}</b><small>{detail}</small><em>{meta}</em></div>
  </button>;
}

function PriceLine({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return <div className="price-line"><span className="price-icon">{icon}</span><span className="price-label"><b>{label}</b>{note && <small>{note}</small>}</span><strong>{value}</strong></div>;
}

function QuotationPreview({ open, onClose, result, customer, currentUser, quotationNo }: {
  open: boolean; onClose: () => void; result: NonNullable<ReturnType<typeof calculatePrice>>; customer: CustomerDetails; currentUser: User; quotationNo: string;
}) {
  const { t, language } = useI18n();
  const issued = new Date();
  return <Modal open={open} title={t('quotation')} onClose={onClose} wide>
    <div className="quote-toolbar no-print"><button className="ghost-button" onClick={onClose}>{t('editInput')}</button><button className="primary-button" onClick={() => window.print()}><FileText/>{t('printPdf')}</button></div>
    <article className="quotation-sheet" id="quotation-print-area">
      <header className="quote-header">
        <div><Brand/><p>Travel design · Flights · Bhutan experiences</p></div>
        <div className="quote-title"><span>{result.channel === 'retail' ? 'RETAIL' : 'AGENT'}</span><h1>{t('quotation')}</h1><b>{quotationNo}</b></div>
      </header>
      <div className="quote-accent"/>
      <section className="quote-meta-grid">
        <div><span>{t('preparedFor')}</span><strong>{customer.name || '-'}</strong><small>{[customer.phone, customer.email].filter(Boolean).join(' · ') || '-'}</small></div>
        <div><span>{t('issueDate')}</span><strong>{formatDate(issued, language)}</strong><small>{t('preparedBy')}: {currentUser.name}</small></div>
      </section>
      <section className="quote-trip-card">
        <div><span>{t('package')}</span><strong>{result.packageName}</strong></div>
        <div><span>{t('travelDate')}</span><strong>{result.travelDate ? formatDate(result.travelDate, language) : '-'}</strong></div>
        <div><span>{t('hotelLevel')}</span><strong>{result.hotelCategory}</strong><small>{result.nights} {t('nights')}</small></div>
        <div><span>{t('passengers')}</span><strong>{result.passengerCount} {t('people')}</strong><small>{result.nights} {t('nights')}</small></div>
      </section>
      <section className="quote-price-table">
        <div className="quote-table-head"><span>{t('pricingDetails')}</span><span>{t('perPerson')}</span><span>{t('groupTotal')}</span></div>
        <QuoteRow label={t('flight')} detail={result.hasGroupFlightDiscount ? `${t('groupDiscount')} ${formatNumber(result.groupDiscountPercentApplied, 2)}%` : 'Economy class'} each={result.airTicketPerPerson} total={result.airTicketPerPerson * result.passengerCount} language={language}/>
        <QuoteRow label={t('airportTax')} detail="Airport & operational taxes" each={result.airportTaxPerPerson} total={result.airportTaxPerPerson * result.passengerCount} language={language}/>
        <QuoteRow label={t('ground')} detail={`${result.hotelCategory} · ${result.nights} ${t('nights')}`} each={result.groundCostTHBPerPerson} total={result.groundCostTHBPerPerson * result.passengerCount} language={language}/>
        <QuoteRow label={t('visa')} detail={`${formatUSD(result.visaUSDPerPerson)} / person`} each={result.visaTHBPerPerson} total={result.visaTHBPerPerson * result.passengerCount} language={language}/>
        {result.businessUpgradeCount > 0 && <QuoteRow label={t('businessUpgrade')} detail={`${result.businessUpgradeCount} ${t('people')}`} each={result.businessUpgradePerPerson} total={result.businessUpgradeTotal} language={language}/>} 
      </section>
      <section className="quote-total-area">
        <div className="quote-note"><span>{t('note')}</span><p>{customer.note || (language === 'th' ? 'ราคานี้รวมบริการตามโปรแกรมที่เลือกและคำนวณจากข้อมูลล่าสุดในระบบ' : 'This price includes services in the selected package and is calculated from the latest system data.')}</p></div>
        <div className="quote-grand-total"><span>{t('totalDue')}</span><strong>{formatTHB(result.groupTotal, language)}</strong><small>{formatTHB(result.sellingPricePerPerson, language)} / {t('people')}</small></div>
      </section>
      <section className="quote-terms"><h3>{t('terms')}</h3><ol><li>{t('term1')}</li><li>{t('term2')}</li><li>{t('term3')}</li></ol></section>
      <footer className="quote-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div className="quote-sign"><span>Authorized signature</span></div></footer>
    </article>
  </Modal>;
}

function QuoteRow({ label, detail, each, total, language }: { label: string; detail: string; each: number; total: number; language: 'th' | 'en' }) {
  return <div className="quote-table-row"><span><b>{label}</b><small>{detail}</small></span><strong>{formatTHB(each, language)}</strong><strong>{formatTHB(total, language)}</strong></div>;
}
