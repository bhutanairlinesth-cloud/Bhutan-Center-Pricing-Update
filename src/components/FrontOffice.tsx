import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgePercent, BedDouble, BriefcaseBusiness, Building2, CalendarDays, Check, ClipboardList,
  ChevronDown, CircleDollarSign, FileText, Hotel as HotelIcon, LogOut, Plane, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Users, WalletCards,
} from 'lucide-react';
import { CustomerDetails, GlobalSettings, HotelCategory, PricingChannel, PricingInput, QuotationRecord, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { calculatePrice, getPackageSingleSupplement } from '../utils/pricing';
import { formatDate, formatNumber, formatTHB, formatUSD, makeId, makeQuotationNo } from '../utils/format';
import { printElementAsA4 } from '../utils/printA4';
import { Brand } from './Brand';
import { Modal } from './Ui';
import { AdditionalItemsEditor } from './AdditionalItemsEditor';

interface FrontOfficeProps {
  settings: GlobalSettings;
  packages: TourPackage[];
  currentUser: User;
  onSaveQuotation: (item: QuotationRecord) => Promise<void>;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const emptyCustomer: CustomerDetails = { name: '', phone: '', email: '', invoiceAddress: '', note: '' };

export function FrontOffice({ settings, packages, currentUser, onSaveQuotation, onOpenTracking, onOpenAdmin, onLogout }: FrontOfficeProps) {
  const { t, language } = useI18n();
  const firstPackage = packages[0];
  const firstCategory: HotelCategory = '3 Stars';
  const [input, setInput] = useState<PricingInput>({
    channel: 'retail',
    pricingMode: 'standard',
    packageId: firstPackage?.id || '',
    passengerCount: 2,
    chargeablePassengerCount: 2,
    hotelCategory: firstCategory,
    travelDate: '',
    businessUpgradeCount: 0,
    businessUpgradePriceOverrideTHB: null,
    singleRoomCount: 0,
    singleSupplementOverrideTHB: null,
    childPassengerCount: 0,
    childSellingPricePerPersonTHB: null,
    childTicketPricePerPersonTHB: null,
    childAirportTaxPerPersonTHB: null,
    additionalItems: [],
    regularLandCostPerPersonOverrideTHB: null,
    tourLeaderLandCostPerPersonTHB: null,
    groupTicketPriceOverrideTHB: null,
    groupAirportTaxOverrideTHB: null,
    groupMarginPerTravelerOverrideTHB: null,
    groupSellingPriceOverrideTHB: null,
  });
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotationNo, setQuotationNo] = useState(makeQuotationNo());
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    if (!input.packageId && packages[0]) setInput((value) => ({ ...value, packageId: packages[0].id }));
  }, [packages, input.packageId]);


  const result = useMemo(() => calculatePrice(input, settings, packages), [input, settings, packages]);
  const selectedPackage = packages.find((pkg) => pkg.id === input.packageId);
  const packageSingleSupplement = getPackageSingleSupplement(selectedPackage, input.hotelCategory);
  const effectiveSingleSupplement = input.singleSupplementOverrideTHB ?? packageSingleSupplement;
  const effectiveBusinessUpgrade = input.businessUpgradePriceOverrideTHB ?? settings.businessUpgradeTHB ?? 15000;
  const agentDiscount = settings.ticketPriceTHB > 0
    ? ((settings.ticketPriceTHB - (settings.agentTicketPriceTHB ?? 25220)) / settings.ticketPriceTHB) * 100
    : 0;
  const groupDiscountMinPax = Math.max(1, Math.round(settings.groupDiscountMinPax ?? 10));
  const groupDiscountPercent = Math.min(100, Math.max(0, settings.groupDiscountPercent ?? 10));
  const groupDiscountDisplay = formatNumber(groupDiscountPercent, Number.isInteger(groupDiscountPercent) ? 0 : 2);
  const groupDiscountLabel = language === 'th'
    ? `ลด ${groupDiscountDisplay}%`
    : `${groupDiscountDisplay}% off`;
  const isGroupTL = input.pricingMode === 'group_tl';
  const chargeablePax = Math.min(input.passengerCount, Math.max(1, input.chargeablePassengerCount || input.passengerCount));
  const tourLeaderCount = Math.max(0, input.passengerCount - chargeablePax);
  const childPax = !isGroupTL ? Math.min(input.passengerCount, Math.max(0, input.childPassengerCount || 0)) : 0;
  const adultPax = Math.max(0, input.passengerCount - childPax);
  const defaultRegularLand = result?.regularLandCostPerPerson || 0;
  const effectiveRegularLand = input.regularLandCostPerPersonOverrideTHB ?? defaultRegularLand;
  const effectiveTlLand = input.tourLeaderLandCostPerPersonTHB ?? 0;
  const effectiveGroupTicket = input.groupTicketPriceOverrideTHB ?? (input.channel === 'agent' ? (settings.agentTicketPriceTHB ?? 25220) : settings.ticketPriceTHB);
  const effectiveGroupTax = input.groupAirportTaxOverrideTHB ?? settings.airportTaxTHB;
  const effectiveGroupMargin = input.groupMarginPerTravelerOverrideTHB ?? (input.channel === 'agent' ? (settings.agentMarginTHB ?? 3000) : settings.marginTHB);

  function update<K extends keyof PricingInput>(key: K, value: PricingInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function setPricingMode(mode: PricingInput['pricingMode']) {
    setInput((current) => {
      if (mode === 'group_tl') {
        const actual = current.passengerCount <= 2 ? 16 : current.passengerCount;
        const chargeable = current.passengerCount <= 2 ? 15 : Math.min(actual, Math.max(1, current.chargeablePassengerCount || actual - 1));
        return {
          ...current,
          pricingMode: mode,
          passengerCount: actual,
          chargeablePassengerCount: chargeable,
          businessUpgradeCount: Math.min(current.businessUpgradeCount, actual),
          singleRoomCount: Math.min(current.singleRoomCount, actual),
          childPassengerCount: 0,
        };
      }
      return { ...current, pricingMode: mode, chargeablePassengerCount: current.passengerCount };
    });
  }

  async function openQuotation() {
    if (!result || savingQuote || !customer.name.trim()) return;
    const nextQuotationNo = makeQuotationNo();
    const now = new Date().toISOString();
    const quotation: QuotationRecord = {
      id: makeId('quote'), quotationNo: nextQuotationNo, status: 'sent',
      customerName: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim(),
      invoiceAddress: customer.invoiceAddress.trim(), note: customer.note.trim(),
      channel: result.channel, pricingMode: result.pricingMode, packageId: input.packageId, packageName: result.packageName,
      hotelCategory: result.hotelCategory, travelDate: result.travelDate, passengerCount: result.passengerCount,
      chargeablePassengerCount: result.chargeablePassengerCount, tourLeaderCount: result.tourLeaderCount,
      sellingPricePerPerson: result.sellingPricePerPerson, childPassengerCount: result.childPassengerCount, childSellingPricePerPerson: result.childSellingPricePerPerson, totalAmount: result.groupTotal,
      pricingInput: { ...input, additionalItems: input.additionalItems.map((item) => ({ ...item })) },
      pricingResult: { ...result, additionalItems: result.additionalItems.map((item) => ({ ...item })) },
      createdById: currentUser.id, createdByName: currentUser.name, confirmedAt: '', convertedTrackingId: '', createdAt: now, updatedAt: now,
    };
    setSavingQuote(true);
    try {
      await onSaveQuotation(quotation);
      setQuotationNo(nextQuotationNo);
      setCustomerOpen(false);
      setQuoteOpen(true);
    } finally { setSavingQuote(false); }
  }

  return <div className="front-shell">
    <header className="front-header">
      <Brand/>
      <div className="front-header-actions">
        <LanguageSwitch compact/>
        <button className="ghost-button desktop-only" onClick={onOpenTracking}><ClipboardList/>{language === 'th' ? 'ติดตามลูกค้า' : 'Customer tracking'}</button>
        <span className="user-chip"><i>{currentUser.name?.[0]?.toUpperCase() || 'U'}</i><span><b>{currentUser.name}</b><small>{currentUser.role}</small></span></span>
        {currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}
        <button className="icon-button" onClick={onLogout} title={t('logout')}><LogOut/></button>
      </div>
    </header>

    <main className="front-main">
      <section className="page-intro">
        <div><span className="eyebrow"><Sparkles/> LIVE PRICING</span><h1>{t('calculatorTitle')}</h1><p>{t('calculatorSubtitle')}</p></div>
        <div className="mobile-workspace-actions"><button className="ghost-button" onClick={onOpenTracking}><ClipboardList/>{language === 'th' ? 'ติดตามลูกค้า' : 'Customer tracking'}</button>{currentUser.role === 'admin' && <button className="ghost-button mobile-admin" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}</div>
      </section>

      <div className="calculator-layout">
        <section className="calculator-form-card">
          <div className="section-block">
            <div className="section-title"><span>01</span><div><h2>{t('channel')}</h2><p>Retail / Wholesale</p></div></div>
            <div className="channel-grid">
              <ChannelCard active={input.channel === 'retail'} channel="retail" title={t('retail')} detail={t('retailHint')} meta={`${formatTHB(settings.ticketPriceTHB, language)} · ${t('margin')} ${formatTHB(settings.marginTHB, language)}`} onClick={() => update('channel', 'retail')}/>
              <ChannelCard active={input.channel === 'agent'} channel="agent" title={t('agent')} detail={t('agentHint')} meta={`${formatTHB(settings.agentTicketPriceTHB ?? 25220, language)} · -${formatNumber(agentDiscount, 2)}%`} onClick={() => update('channel', 'agent')}/>
            </div>
            <div className="pricing-mode-switch">
              <button type="button" className={!isGroupTL ? 'active' : ''} onClick={() => setPricingMode('standard')}>
                <Users/><span><b>{language === 'th' ? 'ราคากรุ๊ปปกติ' : 'Standard group'}</b><small>{language === 'th' ? 'คิดราคาตามจำนวนผู้เดินทางทุกท่าน' : 'Every traveller is billed'}</small></span>
              </button>
              <button type="button" className={isGroupTL ? 'active' : ''} onClick={() => setPricingMode('group_tl')}>
                <BadgePercent/><span><b>{language === 'th' ? 'กรุ๊ปใหญ่ + Tour Leader' : 'Large group + Tour Leader'}</b><small>{language === 'th' ? 'เช่น 15+1 TL เดินทาง 16 แต่เฉลี่ยเรียกเก็บ 15 ท่าน' : 'e.g. 15+1 TL: 16 travel, 15 are billed'}</small></span>
              </button>
            </div>
          </div>

          <div className="section-divider"/>
          <div className="section-block">
            <div className="section-title"><span>02</span><div><h2>{t('tripDetails')}</h2><p>{packages.length} packages · 3 hotel levels</p></div></div>
            <div className="form-grid">
              <label className="field span-2"><span>{t('package')}</span><div className="select-wrap"><Plane/><select value={input.packageId} onChange={(event) => setInput((value) => ({ ...value, packageId: event.target.value, singleSupplementOverrideTHB: null }))}>{packages.map((pkg) => <option value={pkg.id} key={pkg.id}>{pkg.name}</option>)}</select><ChevronDown/></div></label>
              <label className="field"><span>{isGroupTL ? (language === 'th' ? 'ผู้เดินทางทั้งหมด (รวม TL)' : 'Total travellers (incl. TL)') : t('passengers')}</span><div className="select-wrap"><Users/><select value={input.passengerCount} onChange={(event) => {
                const pax = Number(event.target.value); setInput((value) => ({ ...value, passengerCount: pax, chargeablePassengerCount: value.pricingMode === 'group_tl' ? Math.min(pax, Math.max(1, value.chargeablePassengerCount)) : pax, businessUpgradeCount: Math.min(value.businessUpgradeCount, Math.max(0, pax - Math.min(pax, value.childPassengerCount || 0))), singleRoomCount: Math.min(value.singleRoomCount, pax), childPassengerCount: Math.min(value.childPassengerCount || 0, pax) }));
              }}>{Array.from({ length: 50 }, (_, index) => index + 1).map((pax) => <option value={pax} key={pax}>{pax} {t('people')}{!isGroupTL && pax >= groupDiscountMinPax && groupDiscountPercent > 0 ? ` · ${groupDiscountLabel}` : ''}</option>)}</select><ChevronDown/></div></label>
              <label className="field"><span>{t('travelDate')}</span><div className="input-with-icon simple"><CalendarDays/><input type="date" value={input.travelDate} onChange={(event) => update('travelDate', event.target.value)}/></div></label>
              <label className="field span-2"><span>{t('hotelLevel')}</span><div className="select-wrap"><Building2/><select value={input.hotelCategory} onChange={(event) => setInput((value) => ({ ...value, hotelCategory: event.target.value as HotelCategory, singleSupplementOverrideTHB: null }))}><option value="3 Stars">3 Stars</option><option value="4 Stars">4 Stars</option><option value="5 Stars">5 Stars</option></select><ChevronDown/></div></label>
            </div>
            {!isGroupTL && <div className={`child-pricing-panel ${childPax > 0 ? 'active' : ''}`}>
              <div className="child-pricing-head"><div><Users/><span><b>{language === 'th' ? 'ราคาสำหรับเด็ก (CHD)' : 'Child pricing (CHD)'}</b><small>{language === 'th' ? 'จำนวนผู้เดินทางรวมด้านบนรวมเด็กแล้ว ระบบจะแยกราคา ADT / CHD ในใบเสนอราคาและ Invoice' : 'The total headcount above already includes children. ADT / CHD prices are split on quotations and invoices.'}</small></span></div><label><span>{language === 'th' ? 'จำนวนเด็ก' : 'Children'}</span><input type="number" min="0" max={input.passengerCount} value={childPax} onChange={(event) => { const count = Math.min(input.passengerCount, Math.max(0, Number(event.target.value))); setInput((value) => ({ ...value, childPassengerCount: count, businessUpgradeCount: Math.min(value.businessUpgradeCount, Math.max(0, value.passengerCount - count)) })); }}/></label></div>
              {childPax > 0 && <div className="child-pricing-grid">
                <label className="field money-input"><span>{language === 'th' ? 'ราคาขายรวมเด็ก / ท่าน' : 'Child total selling / pax'}</span><div><input type="number" min="0" step="1" value={input.childSellingPricePerPersonTHB ?? result?.sellingPricePerPerson ?? 0} onChange={(event) => update('childSellingPricePerPersonTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div><small>{language === 'th' ? 'ราคาที่แจ้งลูกค้า รวมตั๋ว + ภาษี + ค่าแพ็กเกจ' : 'Customer price including airfare, tax and package balance'}</small></label>
                <label className="field money-input"><span>{language === 'th' ? 'ราคาตั๋วเด็ก / ท่าน' : 'Child airfare / pax'}</span><div><input type="number" min="0" step="1" value={input.childTicketPricePerPersonTHB ?? result?.airTicketPerPerson ?? 0} onChange={(event) => update('childTicketPricePerPersonTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'ภาษีสนามบินเด็ก / ท่าน' : 'Child airport tax / pax'}</span><div><input type="number" min="0" step="1" value={input.childAirportTaxPerPersonTHB ?? result?.airportTaxPerPerson ?? 0} onChange={(event) => update('childAirportTaxPerPersonTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <div className="child-price-balance"><span>{language === 'th' ? 'ส่วนค่าแพ็กเกจเด็กหลังหักตั๋ว+ภาษี' : 'Child package balance after airfare + tax'}</span><strong>{formatTHB(Math.max(0, (result?.childSellingPricePerPerson || 0) - (result?.childTicketPricePerPerson || 0) - (result?.childAirportTaxPerPerson || 0)), language)}</strong><small>{language === 'th' ? `${adultPax} ผู้ใหญ่ + ${childPax} เด็ก = ${input.passengerCount} ท่าน` : `${adultPax} adults + ${childPax} children = ${input.passengerCount} travellers`}</small></div>
              </div>}
            </div>}
            {isGroupTL && <div className="group-tl-pricing-panel">
              <div className="group-tl-head">
                <div><BadgePercent/><span><b>{language === 'th' ? 'คำนวณกรุ๊ปใหญ่แบบ TL' : 'Tour-leader group pricing'}</b><small>{language === 'th' ? 'รวมต้นทุนผู้เดินทางทุกคน แล้วเฉลี่ยเรียกเก็บเฉพาะผู้ชำระ' : 'Pool every traveller cost, then average across paying travellers.'}</small></span></div>
                <div className="group-tl-badge">{chargeablePax}+{tourLeaderCount} TL</div>
              </div>
              <div className="group-tl-count-grid">
                <label className="field"><span>{language === 'th' ? 'จำนวนผู้ชำระเงิน' : 'Chargeable travellers'}</span><input type="number" min="1" max={input.passengerCount} value={chargeablePax} onChange={(event) => update('chargeablePassengerCount', Math.min(input.passengerCount, Math.max(1, Number(event.target.value))))}/></label>
                <div className="group-tl-stat"><span>{language === 'th' ? 'ผู้เดินทางจริง' : 'Actual travellers'}</span><strong>{input.passengerCount}</strong><small>{language === 'th' ? 'รวม Tour Leader' : 'including TL'}</small></div>
                <div className="group-tl-stat"><span>Tour Leader</span><strong>{tourLeaderCount}</strong><small>{language === 'th' ? 'ฟรีเฉพาะที่พัก' : 'hotel-only complimentary'}</small></div>
              </div>
              <div className="group-tl-money-grid">
                <label className="field money-input"><span>{language === 'th' ? 'LAND ผู้ชำระ / ท่าน' : 'Regular LAND / pax'}</span><div><input type="number" min="0" step="1" value={effectiveRegularLand} onChange={(event) => update('regularLandCostPerPersonOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div><small>{language === 'th' ? 'รวมที่พัก SDF วีซ่า และบริการภาคพื้น' : 'Hotel, SDF, visa and ground services'}</small></label>
                <label className="field money-input"><span>{language === 'th' ? 'LAND ของ TL / ท่าน' : 'TL LAND / pax'}</span><div><input type="number" min="0" step="1" value={effectiveTlLand} onChange={(event) => update('tourLeaderLandCostPerPersonTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div><small>{language === 'th' ? 'กรอกหลังหักค่าที่พักฟรี แต่ยังรวม SDF/วีซ่า' : 'After free hotel; still includes SDF/visa'}</small></label>
                <label className="field money-input"><span>{language === 'th' ? 'ค่าโดยสาร Economy (ไม่รวมภาษี) / ผู้เดินทางจริง' : 'Economy fare excl. tax / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupTicket} onChange={(event) => update('groupTicketPriceOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'ภาษีสนามบิน / ผู้เดินทางจริง' : 'Airport tax / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupTax} onChange={(event) => update('groupAirportTaxOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'Margin / ผู้เดินทางจริง' : 'Margin / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupMargin} onChange={(event) => update('groupMarginPerTravelerOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'ราคาขายจริง / ผู้ชำระ (แก้ได้)' : 'Final selling / paying pax (editable)'}</span><div><input type="number" min="0" step="500" value={input.groupSellingPriceOverrideTHB ?? 0} onChange={(event) => update('groupSellingPriceOverrideTHB', Number(event.target.value) > 0 ? Number(event.target.value) : null)}/><em>THB</em></div><small>{language === 'th' ? 'ใส่ 0 เพื่อใช้ราคาแนะนำอัตโนมัติ' : 'Enter 0 to use the recommended price'}</small></label>
              </div>
              <div className="group-tl-note"><ShieldCheck/><span>{language === 'th' ? `ระบบคิดค่าโดยสาร Economy และภาษีครบ ${input.passengerCount} ท่าน รวม LAND ผู้ชำระ ${chargeablePax} ท่าน และ LAND ของ TL ${tourLeaderCount} ท่าน แล้วเฉลี่ยหาร ${chargeablePax} ท่าน ส่วน Business Class คิดเพิ่มเฉพาะ ${input.businessUpgradeCount} ท่านที่อัปเกรดภายในผู้เดินทางจริง` : `Economy fare and tax apply to all ${input.passengerCount}; regular LAND applies to ${chargeablePax} and TL LAND to ${tourLeaderCount}, averaged across ${chargeablePax} payers. Business Class is added only for the ${input.businessUpgradeCount} upgraded travellers within the actual group.`}</span></div>
            </div>}
          </div>

          <div className="single-room-row">
            <div className="upgrade-icon single"><BedDouble/></div>
            <div className="upgrade-copy"><b>{t('singleRoom')}</b><span>{t('singleRoomHint')}</span></div>
            <div className="single-room-controls">
              <div className="single-room-price">
                <label>{t('singleSupplement')}</label>
                <div><input type="number" min="0" step="100" value={effectiveSingleSupplement} onChange={(event) => update('singleSupplementOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div>
                {input.singleSupplementOverrideTHB !== null && input.singleSupplementOverrideTHB !== undefined
                  ? <button type="button" onClick={() => update('singleSupplementOverrideTHB', null)}><RotateCcw/>{t('resetDefault')}</button>
                  : <small>{t('packageDefault')}</small>}
              </div>
              <div className="single-room-count"><label>{t('singleRoomCount')}</label><div className="stepper"><button type="button" onClick={() => update('singleRoomCount', Math.max(0, input.singleRoomCount - 1))}>−</button><strong>{input.singleRoomCount}</strong><button type="button" onClick={() => update('singleRoomCount', Math.min(input.passengerCount, input.singleRoomCount + 1))}>+</button></div></div>
            </div>
          </div>

          <div className="upgrade-row business-upgrade-row">
            <div className="upgrade-icon"><BriefcaseBusiness/></div>
            <div className="upgrade-copy"><b>{t('businessUpgrade')}</b><span>{isGroupTL
              ? (language === 'th'
                ? `ผู้โดยสาร BC เป็นส่วนหนึ่งของผู้เดินทางจริง ${input.passengerCount} ท่าน และคิดส่วนเพิ่มเฉพาะจำนวนที่อัปเกรด`
                : `BC passengers are included within the ${input.passengerCount} actual travellers; the surcharge applies only to those upgraded.`)
              : t('businessUpgradeHint')}</span></div>
            <div className="business-upgrade-controls">
              <div className="business-upgrade-price">
                <label>{isGroupTL ? (language === 'th' ? 'ส่วนต่างค่าโดยสาร BC / ท่าน' : 'BC fare difference / pax') : (language === 'th' ? 'ส่วนเพิ่ม / ท่าน' : 'Upgrade / pax')}</label>
                <div><input type="number" min="0" step="100" value={effectiveBusinessUpgrade} onChange={(event) => update('businessUpgradePriceOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div>
                {input.businessUpgradePriceOverrideTHB !== null && input.businessUpgradePriceOverrideTHB !== undefined
                  ? <button type="button" onClick={() => update('businessUpgradePriceOverrideTHB', null)}><RotateCcw/>{t('resetDefault')}</button>
                  : <small>{language === 'th' ? 'ราคาตั้งต้นจากหลังบ้าน' : 'Default from back office'}</small>}
              </div>
              <div className="business-upgrade-count"><label>{isGroupTL
                ? (language === 'th' ? `จำนวน BC (จาก ${input.passengerCount} ท่าน)` : `BC pax (of ${input.passengerCount})`)
                : (language === 'th' ? 'จำนวนผู้โดยสาร' : 'Passengers')}</label><div className="stepper"><button type="button" onClick={() => update('businessUpgradeCount', Math.max(0, input.businessUpgradeCount - 1))}>−</button><strong>{input.businessUpgradeCount}</strong><button type="button" onClick={() => update('businessUpgradeCount', Math.min(isGroupTL ? input.passengerCount : adultPax, input.businessUpgradeCount + 1))}>+</button></div></div>
            </div>
          </div>

          <AdditionalItemsEditor
            items={input.additionalItems}
            passengerCount={input.passengerCount}
            language={language}
            onChange={(items) => update('additionalItems', items)}
          />
        </section>

        <aside className="price-summary-card">
          <div className="summary-top">
            <span className={`channel-badge ${input.channel}`}>{input.channel === 'retail' ? t('retail') : t('agent')}</span>
            {isGroupTL && <span className="group-tl-summary-badge">{chargeablePax}+{tourLeaderCount} TL</span>}
            <span className="live-dot"><i/> LIVE</span>
          </div>
          <div className="summary-hero">
            <span>{isGroupTL ? (language === 'th' ? 'ราคาขายเฉลี่ย / ผู้ชำระ' : 'Average selling / payer') : t('perPerson')}</span>
            <strong>{formatTHB(result?.sellingPricePerPerson || 0, language)}</strong>
            <small>{isGroupTL
              ? (language === 'th' ? `เดินทาง ${input.passengerCount} · เรียกเก็บ ${chargeablePax} · TL ${tourLeaderCount}` : `${input.passengerCount} travel · ${chargeablePax} billed · ${tourLeaderCount} TL`)
              : childPax > 0 ? (language === 'th' ? `${adultPax} ผู้ใหญ่ · ${childPax} เด็ก · เด็ก ${formatTHB(result?.childSellingPricePerPerson || 0, language)}/ท่าน` : `${adultPax} adults · ${childPax} children · child ${formatTHB(result?.childSellingPricePerPerson || 0, language)}/pax`) : `${selectedPackage?.nights || 0} ${t('nights')} · ${input.passengerCount} ${t('people')}`}</small>
          </div>
          <div className="summary-lines">
            {isGroupTL && <PriceLine icon={<HotelIcon/>} label={language === 'th' ? 'LAND ผู้ชำระรวม' : 'Regular LAND total'} value={formatTHB(result?.regularLandTotal || 0, language)} note={`${formatTHB(result?.regularLandCostPerPerson || 0, language)} × ${chargeablePax}`}/>}
            {isGroupTL && tourLeaderCount > 0 && <PriceLine icon={<BadgePercent/>} label={language === 'th' ? 'LAND ของ TL รวม' : 'TL LAND total'} value={formatTHB(result?.tourLeaderLandTotal || 0, language)} note={`${formatTHB(result?.tourLeaderLandCostPerPerson || 0, language)} × ${tourLeaderCount}`}/>}
            <PriceLine icon={<Plane/>} label={language === 'th' ? 'ค่าตั๋วรวม' : 'Total airfare'} value={formatTHB(result?.flightTotal || 0, language)} note={`${formatTHB(result?.airTicketPerPerson || 0, language)} × ${input.passengerCount}${result?.hasGroupFlightDiscount ? ` · ${groupDiscountLabel}` : ''}`}/>
            <PriceLine icon={<WalletCards/>} label={language === 'th' ? 'ภาษีสนามบินรวม' : 'Total airport tax'} value={formatTHB(result?.airportTaxTotal || 0, language)} note={`${formatTHB(result?.airportTaxPerPerson || 0, language)} × ${input.passengerCount}`}/>
            {!isGroupTL && <PriceLine icon={<HotelIcon/>} label={t('ground')} value={formatTHB(result?.groundCostTHBPerPerson || 0, language)} note={`${formatUSD(result?.groundRateUSDPerPersonPerNight || 0)} / night / pax`}/>}
            {isGroupTL && <PriceLine icon={<CircleDollarSign/>} label={language === 'th' ? 'Margin รวมทั้งกรุ๊ป' : 'Group margin target'} value={formatTHB(result?.groupMarginTotal || 0, language)} note={`${formatTHB(result?.groupMarginPerTraveler || 0, language)} × ${input.passengerCount}`}/>}
            {(result?.businessUpgradeTotal || 0) > 0 && <PriceLine icon={<BriefcaseBusiness/>} label="Business Class" value={formatTHB(result?.businessUpgradeTotal || 0, language)} note={isGroupTL
              ? (language === 'th'
                ? `${result?.businessUpgradeCount || 0} จากผู้เดินทางจริง ${input.passengerCount} ท่าน × ${formatTHB(result?.businessUpgradePerPerson || 0, language)}`
                : `${result?.businessUpgradeCount || 0} of ${input.passengerCount} actual travellers × ${formatTHB(result?.businessUpgradePerPerson || 0, language)}`)
              : `${result?.businessUpgradeCount || 0} × ${formatTHB(result?.businessUpgradePerPerson || 0, language)}`}/>}
            {(result?.singleRoomCount || 0) > 0 && <PriceLine icon={<BedDouble/>} label={t('singleRoom')} value={formatTHB(result?.singleSupplementTotal || 0, language)} note={`${result?.singleRoomCount || 0} ${t('people')} × ${formatTHB(result?.singleSupplementPerPerson || 0, language)}`}/>}
            {(result?.additionalItemsTotal || 0) > 0 && <PriceLine icon={<Sparkles/>} label={language === 'th' ? 'รายการเพิ่มเติมรวม' : 'Additional services'} value={formatTHB(result?.additionalItemsTotal || 0, language)} note={`${result?.additionalItems.length || 0} ${language === 'th' ? 'รายการ' : 'items'}`}/>}
            {!isGroupTL && <PriceLine icon={<ShieldCheck/>} label={t('visa')} value={formatTHB(result?.visaTHBPerPerson || 0, language)} note={formatUSD(result?.visaUSDPerPerson || 0)}/>}
          </div>
          {isGroupTL ? <>
            <div className="group-tl-average-box">
              <div><span>{language === 'th' ? 'ยอดรวมก่อนเฉลี่ย' : 'Total before averaging'}</span><b>{formatTHB(result?.totalBeforeAverage || 0, language)}</b></div>
              <div><span>{language === 'th' ? `เฉลี่ยหาร ${chargeablePax} ท่าน` : `Average across ${chargeablePax} payers`}</span><b>{formatTHB(result?.averageBeforeRounding || 0, language)}</b></div>
              <div><span>{language === 'th' ? 'ปัดราคาขึ้น / ท่าน' : 'Rounded selling / payer'}</span><b>{formatTHB(result?.sellingPricePerPerson || 0, language)}</b></div>
            </div>
            <div className="profit-strip"><div><span>{language === 'th' ? 'ต้นทุนดำเนินการรวม' : 'Operating cost total'}</span><b>{formatTHB(result?.operatingCostTotal || 0, language)}</b></div><div><span>{language === 'th' ? 'กำไรหลังปัดราคา' : 'Profit after rounding'}</span><b>{formatTHB(result?.groupProfit || 0, language)}</b></div></div>
          </> : <div className="profit-strip"><div><span>{language === 'th' ? 'ต้นทุนต่อท่าน' : 'Cost / pax'}</span><b>{formatTHB(result?.baseCostPerPerson || 0, language)}</b></div><div><span>{language === 'th' ? 'กำไรต่อท่าน' : 'Profit / pax'}</span><b>{formatTHB(result?.profitPerPerson || 0, language)}</b></div></div>}
          <div className="auto-total-breakdown">
            <div><span>{isGroupTL
              ? (language === 'th' ? `แพ็กเกจพื้นฐาน × ผู้ชำระ ${chargeablePax} ท่าน` : `Base package × ${chargeablePax} paying travellers`)
              : (language === 'th' ? 'แพ็กเกจพื้นฐานรวม ADT / CHD' : 'Base package ADT / CHD')}</span><b>{formatTHB(result?.groupSubtotal || 0, language)}</b></div>
            {!isGroupTL && childPax > 0 && <><div><span>{language === 'th' ? `ผู้ใหญ่ ${adultPax} ท่าน` : `Adults ${adultPax}`}</span><b>{formatTHB(result?.adultSubtotal || 0, language)}</b></div><div><span>{language === 'th' ? `เด็ก ${childPax} ท่าน` : `Children ${childPax}`}</span><b>{formatTHB(result?.childSubtotal || 0, language)}</b></div></>}
            {(result?.businessUpgradeTotal || 0) > 0 && <div><span>{isGroupTL
              ? (language === 'th' ? `Business Class ${result?.businessUpgradeCount || 0} จาก ${input.passengerCount} ท่าน` : `Business Class ${result?.businessUpgradeCount || 0} of ${input.passengerCount}`)
              : 'Business Class'}</span><b>+ {formatTHB(result?.businessUpgradeTotal || 0, language)}</b></div>}
            {(result?.singleSupplementTotal || 0) > 0 && <div><span>{t('singleRoom')}</span><b>+ {formatTHB(result?.singleSupplementTotal || 0, language)}</b></div>}
            {(result?.additionalItemsTotal || 0) > 0 && <div><span>{language === 'th' ? 'รายการเพิ่มเติม' : 'Additional services'}</span><b>+ {formatTHB(result?.additionalItemsTotal || 0, language)}</b></div>}
          </div>
          <div className="group-total"><span>{language === 'th' ? 'ยอดรวมทั้งหมด ก่อนออกเอกสาร' : 'Grand total before document'}</span><strong>{formatTHB(result?.groupTotal || 0, language)}</strong><small>{isGroupTL ? (language === 'th' ? `เรียกเก็บ ${chargeablePax} ท่าน จากผู้เดินทางจริง ${input.passengerCount} ท่าน` : `${chargeablePax} billed from ${input.passengerCount} actual travellers`) : (language === 'th' ? 'ระบบคำนวณจากจำนวนผู้เดินทางและรายการทั้งหมดอัตโนมัติ' : 'Automatically calculated from all travellers and services')}</small></div>
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
        <label className="field"><span>{language === 'th' ? 'ที่อยู่สำหรับออกเอกสาร (ไม่บังคับ)' : 'Billing / invoice address (optional)'}</span><textarea rows={3} value={customer.invoiceAddress} onChange={(event) => setCustomer((value) => ({ ...value, invoiceAddress: event.target.value }))} placeholder={language === 'th' ? 'ชื่อบริษัท ที่อยู่ เลขประจำตัวผู้เสียภาษี หรือเว้นว่างได้' : 'Company, address, tax ID, or leave blank'}/></label>
        <label className="field"><span>{t('note')}</span><textarea rows={3} value={customer.note} onChange={(event) => setCustomer((value) => ({ ...value, note: event.target.value }))}/></label>
        <div className="modal-actions"><button className="ghost-button" onClick={() => setCustomerOpen(false)}>{t('cancel')}</button><button className="primary-button" onClick={() => { void openQuotation(); }} disabled={!customer.name.trim() || savingQuote}>{savingQuote ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t('continue')}<ArrowRight/></button></div>
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

function QuotationPreview({ open, onClose, result, customer, currentUser, quotationNo }: {
  open: boolean; onClose: () => void; result: NonNullable<ReturnType<typeof calculatePrice>>; customer: CustomerDetails; currentUser: User; quotationNo: string;
}) {
  const { t, language } = useI18n();
  const issued = new Date();
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
  return <Modal open={open} title={t('quotation')} onClose={onClose} wide>
    <div className="quote-toolbar no-print"><button className="ghost-button" onClick={onClose}>{t('editInput')}</button><button className="primary-button" onClick={() => { void printElementAsA4('quotation-print-area', `${quotationNo} - ${customer.name}`); }}><FileText/>{t('printPdf')}</button></div>
    <article className="quotation-sheet" id="quotation-print-area">
      <header className="quote-header">
        <div><Brand/><p>Travel design · Flights · Bhutan experiences</p></div>
        <div className="quote-title"><span>{result.channel === 'retail' ? 'RETAIL' : 'AGENT'}</span><h1>{t('quotation')}</h1><b>{quotationNo}</b></div>
      </header>
      <div className="quote-accent"/>
      <section className="quote-meta-grid">
        <div><span>{t('preparedFor')}</span><strong>{customer.name || '-'}</strong><small>{[customer.phone, customer.email].filter(Boolean).join(' · ') || '-'}</small>{customer.invoiceAddress && <small className="quote-address">{customer.invoiceAddress}</small>}</div>
        <div><span>{t('issueDate')}</span><strong>{formatDate(issued, language)}</strong><small>{t('preparedBy')}: {currentUser.name}</small></div>
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
      {customer.note && <section className="quote-total-area quote-total-area-simple">
        <div className="quote-note"><span>{t('note')}</span><p>{customer.note}</p></div>
      </section>}
      <section className="quote-terms"><h3>{t('terms')}</h3><ol><li>{t('term1')}</li><li>{t('term2')}</li><li>{t('term3')}</li></ol></section>
      <footer className="quote-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div className="quote-sign"><span>Authorized signature</span></div></footer>
    </article>
  </Modal>;
}

