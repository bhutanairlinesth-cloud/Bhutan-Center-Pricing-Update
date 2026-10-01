import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgePercent, BedDouble, BriefcaseBusiness, Building2, CalendarDays, Check, ClipboardList,
  ChevronDown, CircleDollarSign, FileText, Hotel as HotelIcon, LayoutDashboard, LogOut, Plane, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Users, WalletCards,
} from 'lucide-react';
import { Agent, GlobalSettings, HotelCategory, PricingChannel, PricingInput, QuotationRecord, TourPackage, User } from '../types';
import { useI18n, LanguageSwitch } from '../i18n';
import { calculatePrice, getConfiguredMargin, getPackageSingleSupplement } from '../utils/pricing';
import { formatDate, formatNumber, formatTHB, formatUSD, makeId } from '../utils/format';
import { database } from '../db/database';
import { Brand } from './Brand';
import { Modal } from './Ui';
import { PageHeader } from '../shared/ui';
import { AdditionalItemsEditor } from './AdditionalItemsEditor';
import {
  applyAgentToCustomer,
  customerFieldsFromQuotation,
  emptyCustomerFields,
  QuotationCustomerFields,
} from './QuotationDocument';

interface FrontOfficeProps {
  embedded?: boolean;
  initialQuotation?: QuotationRecord;
  settings: GlobalSettings;
  packages: TourPackage[];
  currentUser: User;
  onSaveQuotation: (item: QuotationRecord) => Promise<void>;
  onSaved?: (id: string) => void;
  onOpenDashboard: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

function defaultPricingInput(firstPackage: TourPackage | undefined, firstCategory: HotelCategory = '3 Stars'): PricingInput {
  return {
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
  };
}

function clonePricingInput(input: PricingInput): PricingInput {
  return { ...input, additionalItems: input.additionalItems.map((item) => ({ ...item })) };
}

const AGENT_RATE_HOTEL_DEFAULTS: Partial<Record<HotelCategory, { thimphu: string[]; punakha: string[]; paro: string[] }>> = {
  '3 Stars': {
    thimphu: ['Thimphu Central', 'Hotel Changangkha', 'Lhakyi Hotel', 'Phuntsho Pelri'],
    punakha: ['River Valley', 'Hotel Lobesa', 'Meri Puensum Hotel'],
    paro: ['Paro Metta Resort', 'Mandala Resort', 'Paro Grand', 'Olathang Cottage'],
  },
  '4 Stars': {
    thimphu: ['Thimphu Capital Hotel', 'Ariya Hotel'],
    punakha: ['RKPO Green Resort', 'Lobesa Boutique Hotel'],
    paro: ['Kaachi Grand', 'Tashi Namgay Resort'],
  },
};

function getDefaultAgentHotelExamples(hotelCategory: HotelCategory, nights: number): string {
  const group = AGENT_RATE_HOTEL_DEFAULTS[hotelCategory];
  if (!group) return '';
  const lines = [`Thimphu : ${group.thimphu.join(' / ')}`];
  if (nights >= 4) lines.push(`Punakha : ${group.punakha.join(' / ')}`);
  lines.push(`Paro : ${group.paro.join(' / ')}`);
  return lines.join('\n');
}

export function FrontOffice({ embedded = false, initialQuotation, settings, packages, currentUser, onSaveQuotation, onSaved, onOpenDashboard, onOpenTracking, onOpenAdmin, onLogout }: FrontOfficeProps) {
  const { t, language } = useI18n();
  const firstPackage = packages[0];
  const firstCategory: HotelCategory = '3 Stars';
  const isEdit = Boolean(initialQuotation);
  const [input, setInput] = useState<PricingInput>(() => (
    initialQuotation ? clonePricingInput(initialQuotation.pricingInput) : defaultPricingInput(firstPackage, firstCategory)
  ));
  const [customer, setCustomer] = useState<QuotationCustomerFields>(() => (
    initialQuotation ? customerFieldsFromQuotation(initialQuotation) : emptyCustomerFields()
  ));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [savingQuote, setSavingQuote] = useState(false);
  useEffect(() => {
    if (!input.packageId && packages[0]) setInput((value) => ({ ...value, packageId: packages[0].id }));
  }, [packages, input.packageId]);
  useEffect(() => {
    void database.getAgents().then((list) => setAgents(list.filter((a) => a.active)));
  }, []);


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
  const baseChannelTicket = input.channel === 'agent' ? (settings.agentTicketPriceTHB ?? 25220) : settings.ticketPriceTHB;
  const defaultGroupTicket = input.passengerCount >= groupDiscountMinPax && groupDiscountPercent > 0
    ? Math.round(baseChannelTicket * (1 - groupDiscountPercent / 100))
    : baseChannelTicket;
  const effectiveGroupTicket = input.groupTicketPriceOverrideTHB ?? defaultGroupTicket;
  const effectiveGroupTax = input.groupAirportTaxOverrideTHB ?? settings.airportTaxTHB;
  const effectiveGroupMargin = input.groupMarginPerTravelerOverrideTHB ?? getConfiguredMargin(settings, input.channel, input.hotelCategory);

  function update<K extends keyof PricingInput>(key: K, value: PricingInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function pickAgent(agentId: string) {
    const agent = agents.find((a) => a.id === agentId);
    setCustomer((value) => applyAgentToCustomer(value, agent));
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

  async function saveQuotation() {
    if (!result || savingQuote) return;
    const now = new Date().toISOString();
    const pricingInput = clonePricingInput(input);
    const pricingResult = { ...result, additionalItems: result.additionalItems.map((item) => ({ ...item })) };
    const pricingFields = {
      channel: result.channel,
      pricingMode: result.pricingMode,
      packageId: input.packageId,
      packageName: result.packageName,
      hotelCategory: result.hotelCategory,
      travelDate: result.travelDate,
      passengerCount: result.passengerCount,
      chargeablePassengerCount: result.chargeablePassengerCount,
      tourLeaderCount: result.tourLeaderCount,
      sellingPricePerPerson: result.sellingPricePerPerson,
      childPassengerCount: result.childPassengerCount,
      childSellingPricePerPerson: result.childSellingPricePerPerson,
      totalAmount: result.groupTotal,
      pricingInput,
      pricingResult,
      updatedAt: now,
    };
    const quotation: QuotationRecord = initialQuotation ? {
      ...initialQuotation,
      ...pricingFields,
      ...customer,
    } : {
      id: makeId('quote'),
      quotationNo: await database.allocateDocNumber('QT'),
      status: 'sent',
      ...customer,
      ...pricingFields,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      confirmedAt: '',
      convertedTrackingId: '',
      createdAt: now,
    };
    setSavingQuote(true);
    try {
      await onSaveQuotation(quotation);
      onSaved?.(quotation.id);
    } finally { setSavingQuote(false); }
  }

  const calculatorTitle = isEdit ? (language === 'th' ? 'แก้ไขใบเสนอราคา' : 'Edit quotation') : t('calculatorTitle');
  const calculatorSubtitle = isEdit
    ? (language === 'th' ? `${initialQuotation?.quotationNo} · บันทึกแล้วกลับไปหน้าใบเสนอราคา` : `${initialQuotation?.quotationNo} · Save to return to the quotation page`)
    : t('calculatorSubtitle');

  return <div className={embedded ? 'front-embedded' : 'front-shell'}>
    {!embedded && <header className="front-header">
      <Brand/>
      <div className="front-header-actions">
        <button className="ghost-button desktop-only" onClick={onOpenDashboard}><LayoutDashboard/>Dashboard</button>
        <LanguageSwitch compact/>
        <button className="ghost-button desktop-only" onClick={onOpenTracking}><ClipboardList/>{language === 'th' ? 'ติดตามลูกค้า' : 'Customer tracking'}</button>
        <span className="user-chip"><i>{currentUser.name?.[0]?.toUpperCase() || 'U'}</i><span><b>{currentUser.name}</b><small>{currentUser.role}</small></span></span>
        {currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}
        <button className="icon-button" onClick={onLogout} title={t('logout')}><LogOut/></button>
      </div>
    </header>}

    <main className="front-main">
      <div className={embedded ? 'module-list-page bo-list-page bo-list-page--wide' : undefined}>
        {embedded ? (
          <PageHeader title={calculatorTitle} subtitle={calculatorSubtitle} />
        ) : (
          <section className="page-intro page-intro--pricing">
            <div><span className="eyebrow"><Sparkles/> LIVE PRICING</span><h1>{calculatorTitle}</h1><p>{calculatorSubtitle}</p></div>
            <div className="pricing-page-actions">
              <div className="mobile-workspace-actions"><button className="ghost-button" onClick={onOpenDashboard}><LayoutDashboard/>Dashboard</button><button className="ghost-button" onClick={onOpenTracking}><ClipboardList/>{language === 'th' ? 'ติดตามลูกค้า' : 'Customer tracking'}</button>{currentUser.role === 'admin' && <button className="ghost-button mobile-admin" onClick={onOpenAdmin}><Settings2/>{t('backOffice')}</button>}</div>
            </div>
          </section>
        )}

        <div className="calculator-layout">
        <section className="calculator-form-card">
          <div className="section-block">
            <div className="section-title"><span>01</span><div><h2>{t('channel')}</h2><p>Retail / Wholesale</p></div></div>
            <div className="channel-grid">
              <ChannelCard active={input.channel === 'retail'} channel="retail" title={t('retail')} detail={t('retailHint')} meta={`${formatTHB(settings.ticketPriceTHB, language)} · ${t('margin')} ${formatTHB(getConfiguredMargin(settings, 'retail', input.hotelCategory), language)}`} onClick={() => update('channel', 'retail')}/>
              <ChannelCard active={input.channel === 'agent'} channel="agent" title={t('agent')} detail={t('agentHint')} meta={`${formatTHB(settings.agentTicketPriceTHB ?? 25220, language)} · -${formatNumber(agentDiscount, 2)}% · ${t('margin')} ${formatTHB(getConfiguredMargin(settings, 'agent', input.hotelCategory), language)}`} onClick={() => update('channel', 'agent')}/>
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
              }}>{Array.from({ length: 50 }, (_, index) => index + 1).map((pax) => <option value={pax} key={pax}>{pax} {t('people')}{pax >= groupDiscountMinPax && groupDiscountPercent > 0 ? ` · ${groupDiscountLabel}` : ''}</option>)}</select><ChevronDown/></div></label>
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
                <label className="field money-input"><span>{language === 'th' ? 'ค่าโดยสาร Economy (ไม่รวมภาษี) / ผู้เดินทางจริง' : 'Economy fare excl. tax / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupTicket} onChange={(event) => update('groupTicketPriceOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div><small>{input.passengerCount >= groupDiscountMinPax && groupDiscountPercent > 0 ? (language === 'th' ? `${input.channel === 'agent' ? 'Agent ' : ''}${formatTHB(baseChannelTicket, language)} → ลดกรุ๊ป ${groupDiscountDisplay}% = ${formatTHB(defaultGroupTicket, language)}` : `${input.channel === 'agent' ? 'Agent ' : ''}${formatTHB(baseChannelTicket, language)} → group ${groupDiscountDisplay}% off = ${formatTHB(defaultGroupTicket, language)}`) : (language === 'th' ? 'ยังไม่ถึงจำนวนขั้นต่ำสำหรับส่วนลดกรุ๊ป' : 'Group discount threshold not reached')}</small></label>
                <label className="field money-input"><span>{language === 'th' ? 'ภาษีสนามบิน / ผู้เดินทางจริง' : 'Airport tax / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupTax} onChange={(event) => update('groupAirportTaxOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'Margin / ผู้เดินทางจริง' : 'Margin / actual traveller'}</span><div><input type="number" min="0" step="1" value={effectiveGroupMargin} onChange={(event) => update('groupMarginPerTravelerOverrideTHB', Math.max(0, Number(event.target.value)))}/><em>THB</em></div></label>
                <label className="field money-input"><span>{language === 'th' ? 'ราคาขายจริง / ผู้ชำระ (แก้ได้)' : 'Final selling / paying pax (editable)'}</span><div><input type="number" min="0" step="500" value={input.groupSellingPriceOverrideTHB ?? 0} onChange={(event) => update('groupSellingPriceOverrideTHB', Number(event.target.value) > 0 ? Number(event.target.value) : null)}/><em>THB</em></div><small>{language === 'th' ? 'ใส่ 0 เพื่อใช้ราคาแนะนำอัตโนมัติ' : 'Enter 0 to use the recommended price'}</small></label>
              </div>
              <div className="group-tl-note"><ShieldCheck/><span>{language === 'th' ? `ระบบคิดค่าโดยสาร Economy และภาษีครบ ${input.passengerCount} ท่าน รวม LAND ผู้ชำระ ${chargeablePax} ท่าน และ LAND ของ TL ${tourLeaderCount} ท่าน แล้วเฉลี่ยหาร ${chargeablePax} ท่าน ส่วน Business Class คิดเพิ่มเฉพาะ ${input.businessUpgradeCount} ท่านที่อัปเกรดภายในผู้เดินทางจริง` : `Economy fare and tax apply to all ${input.passengerCount}; regular LAND applies to ${chargeablePax} and TL LAND to ${tourLeaderCount}, averaged across ${chargeablePax} payers. Business Class is added only for the ${input.businessUpgradeCount} upgraded travellers within the actual group.`}</span></div>
            </div>}
          </div>

          <div className="section-divider"/>
          <div className="section-block">
            <div className="section-title"><span>03</span><div><h2>{language === 'th' ? 'ลูกค้า' : 'Customer'}</h2><p>{language === 'th' ? 'ไม่บังคับ · แก้ไขภายหลังได้ที่ปุ่ม แก้ไข' : 'Optional · edit later via the Edit button'}</p></div></div>
            <div className="form-grid">
              {input.channel === 'agent' ? (
                <label className="field span-2">
                  <span>{language === 'th' ? 'เอเจนต์ / บริษัท' : 'Agent / company'}</span>
                  <div className="select-wrap">
                    <Building2/>
                    <select value={customer.agentId} onChange={(event) => pickAgent(event.target.value)}>
                      <option value="">{language === 'th' ? '— เลือกเอเจนต์ —' : '— Select agent —'}</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.code ? `${agent.code} · ` : ''}{agent.name}</option>
                      ))}
                    </select>
                    <ChevronDown/>
                  </div>
                </label>
              ) : (
                <label className="field span-2">
                  <span>{language === 'th' ? 'ชื่อลูกค้า / บริษัท' : 'Customer / company name'}</span>
                  <div className="input-with-icon simple">
                    <Users/>
                    <input
                      value={customer.customerName}
                      onChange={(event) => setCustomer((value) => ({ ...value, customerName: event.target.value }))}
                      placeholder={language === 'th' ? 'ชื่อลูกค้าหรือบริษัท' : 'Customer or company name'}
                    />
                  </div>
                </label>
              )}
              <label className="field">
                <span>{language === 'th' ? 'โทรศัพท์' : 'Phone'}</span>
                <div className="input-with-icon simple">
                  <input value={customer.phone} onChange={(event) => setCustomer((value) => ({ ...value, phone: event.target.value }))}/>
                </div>
              </label>
              <label className="field">
                <span>{language === 'th' ? 'อีเมล' : 'Email'}</span>
                <div className="input-with-icon simple">
                  <input type="email" value={customer.email} onChange={(event) => setCustomer((value) => ({ ...value, email: event.target.value }))}/>
                </div>
              </label>
              <label className="field span-2">
                <span>{language === 'th' ? 'ที่อยู่ออกใบแจ้งหนี้' : 'Invoice address'}</span>
                <textarea rows={2} value={customer.invoiceAddress} onChange={(event) => setCustomer((value) => ({ ...value, invoiceAddress: event.target.value }))}/>
              </label>
              <label className="field span-2">
                <span>{language === 'th' ? 'หมายเหตุ' : 'Note'}</span>
                <textarea rows={2} value={customer.note} onChange={(event) => setCustomer((value) => ({ ...value, note: event.target.value }))}/>
              </label>
            </div>
          </div>

          <CalculatorExtraSection
            className="calc-extra-section--single"
            icon={<BedDouble />}
            title={t('singleRoom')}
            hint={language === 'th' ? 'ส่วนเสริม — เปิดเมื่อมีห้องพักเดี่ยว' : 'Optional — open when single rooms apply'}
            badge={input.singleRoomCount > 0 ? `${input.singleRoomCount} ${t('people')}` : undefined}
            defaultOpen={input.singleRoomCount > 0 || input.singleSupplementOverrideTHB != null}
          >
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
          </CalculatorExtraSection>

          <CalculatorExtraSection
            className="calc-extra-section--business"
            icon={<BriefcaseBusiness />}
            title={t('businessUpgrade')}
            hint={language === 'th' ? 'ส่วนเสริม — เปิดเมื่อมีอัปเกรด Business Class' : 'Optional — open for Business Class upgrades'}
            badge={input.businessUpgradeCount > 0 ? `${input.businessUpgradeCount} ${language === 'th' ? 'ท่าน' : 'pax'}` : undefined}
            defaultOpen={input.businessUpgradeCount > 0 || input.businessUpgradePriceOverrideTHB != null}
          >
            <p className="calc-extra-section-note">{isGroupTL
              ? (language === 'th'
                ? `ผู้โดยสาร BC เป็นส่วนหนึ่งของผู้เดินทางจริง ${input.passengerCount} ท่าน และคิดส่วนเพิ่มเฉพาะจำนวนที่อัปเกรด`
                : `BC passengers are included within the ${input.passengerCount} actual travellers; the surcharge applies only to those upgraded.`)
              : t('businessUpgradeHint')}</p>
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
          </CalculatorExtraSection>

          <CalculatorExtraSection
            className="calc-extra-section--addons"
            icon={<Sparkles />}
            title={language === 'th' ? 'รายการเพิ่มเติม' : 'Additional services'}
            hint={language === 'th' ? 'ส่วนเสริม — เปิดเมื่อมีบริการพิเศษ' : 'Optional — open for extra services'}
            badge={input.additionalItems.length > 0 ? (language === 'th' ? `${input.additionalItems.length} รายการ` : `${input.additionalItems.length} items`) : undefined}
            defaultOpen={input.additionalItems.length > 0}
          >
            <AdditionalItemsEditor
              headless
              items={input.additionalItems}
              passengerCount={input.passengerCount}
              language={language}
              onChange={(items) => update('additionalItems', items)}
            />
          </CalculatorExtraSection>
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
          <button className="primary-button quote-button" disabled={!result || savingQuote} onClick={() => { void saveQuotation(); }}><FileText/><span>{savingQuote ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : isEdit ? (language === 'th' ? 'บันทึกการแก้ไข' : 'Save changes') : t('createQuote')}</span><ArrowRight/></button>
          <div className="summary-foot"><CircleDollarSign/><span>1 USD = {formatNumber(settings.exchangeRateUSD, 2)} THB · Rounded up / 500 THB</span></div>
        </aside>
      </div>
      </div>
    </main>

  </div>;
}

export function AgentRateSheetRoute({ settings, packages, onBack }: { settings: GlobalSettings; packages: TourPackage[]; onBack: () => void }) {
  return (
    <div className="front-shell front-shell--embedded agent-rate-route">
      <AgentRateSheetModal open settings={settings} packages={packages} onClose={onBack} />
    </div>
  );
}

function CalculatorExtraSection({
  icon,
  title,
  hint,
  badge,
  defaultOpen = false,
  className = '',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  badge?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`calc-extra-section ${open ? 'expanded' : ''} ${className}`.trim()}>
      <button type="button" className="calc-extra-section-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="calc-extra-section-icon">{icon}</span>
        <span className="calc-extra-section-copy">
          <strong>{title}</strong>
          <small>{hint}</small>
        </span>
        {badge && <span className="calc-extra-section-badge">{badge}</span>}
        <ChevronDown className="calc-extra-section-chevron" aria-hidden />
      </button>
      {open && <div className="calc-extra-section-body">{children}</div>}
    </section>
  );
}

function ChannelCard({ active, channel, title, detail, meta, onClick }: { active: boolean; channel: PricingChannel; title: string; detail: string; meta: string; onClick: () => void }) {
  return <button type="button" className={`channel-card ${channel} ${active ? 'active' : ''}`} onClick={onClick}>
    <span className="channel-check">{active && <Check/>}</span><div><b>{title}</b><small>{detail}</small><em>{meta}</em></div>
  </button>;
}

function PriceLine({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return <div className="price-line"><span className="price-icon">{icon}</span><span className="price-label"><b>{label}</b>{note && <small>{note}</small>}</span><strong>{value}</strong></div>;
}


type AgentRateSheetRow = {
  packageId: string;
  packageName: string;
  nights: number;
  hotelCategory: HotelCategory;
  ticketAndTax: number;
  businessUpgrade: number;
  landPax1: number;
  landPax2: number;
  landPax3Plus: number;
  singleSupplement: number;
};

const AGENT_RATE_HOTELS: HotelCategory[] = ['3 Stars', '4 Stars', '5 Stars'];

function createAgentRatePricingInput(packageId: string, hotelCategory: HotelCategory, passengerCount: number): PricingInput {
  return {
    channel: 'agent',
    pricingMode: 'standard',
    packageId,
    passengerCount,
    chargeablePassengerCount: passengerCount,
    hotelCategory,
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
  };
}

function buildAgentRateRow(settings: GlobalSettings, packages: TourPackage[], packageId: string, hotelCategory: HotelCategory): AgentRateSheetRow | null {
  const pkg = packages.find((item) => item.id === packageId);
  if (!pkg) return null;
  const result1 = calculatePrice(createAgentRatePricingInput(packageId, hotelCategory, 1), settings, packages);
  const result2 = calculatePrice(createAgentRatePricingInput(packageId, hotelCategory, 2), settings, packages);
  const result3 = calculatePrice(createAgentRatePricingInput(packageId, hotelCategory, 3), settings, packages);
  if (!result1 || !result2 || !result3) return null;
  const landNet = (result: NonNullable<ReturnType<typeof calculatePrice>>) => Math.max(0, result.sellingPricePerPerson - result.airTicketPerPerson - result.airportTaxPerPerson);
  return {
    packageId,
    packageName: pkg.name,
    nights: pkg.nights,
    hotelCategory,
    ticketAndTax: result3.airTicketPerPerson + result3.airportTaxPerPerson,
    businessUpgrade: Number(settings.businessUpgradeTHB ?? 15000),
    landPax1: landNet(result1),
    landPax2: landNet(result2),
    landPax3Plus: landNet(result3),
    singleSupplement: getPackageSingleSupplement(pkg, hotelCategory),
  };
}

export function AgentRateSheetModal({ open, onClose, settings, packages, defaultPackageId, defaultHotelCategory }: {
  open: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  packages: TourPackage[];
  defaultPackageId?: string;
  defaultHotelCategory?: HotelCategory;
}) {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<HotelCategory[]>([]);
  const [agentName, setAgentName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [note, setNote] = useState('ราคาสำหรับ Agent เท่านั้น กรุ๊ปตั้งแต่ 10 ท่านขึ้นไปกรุณาสอบถามราคาอีกครั้ง');
  const [hotelExamples, setHotelExamples] = useState<Record<HotelCategory, string>>({ '3 Stars': '', '4 Stars': '', '5 Stars': '' });

  useEffect(() => {
    if (!open) return;
    setSelectedPackageIds((current) => current.length ? current : [defaultPackageId || packages[0]?.id].filter(Boolean) as string[]);
    setSelectedHotels((current) => current.length ? current : [defaultHotelCategory || '3 Stars']);
  }, [open, defaultPackageId, defaultHotelCategory, packages]);

  const rows = useMemo(() => selectedPackageIds.flatMap((packageId) => selectedHotels
    .map((hotelCategory) => buildAgentRateRow(settings, packages, packageId, hotelCategory))
    .filter((item): item is AgentRateSheetRow => Boolean(item))), [selectedPackageIds, selectedHotels, settings, packages]);

  function togglePackage(packageId: string) {
    setSelectedPackageIds((current) => current.includes(packageId) ? current.filter((id) => id !== packageId) : [...current, packageId]);
  }
  function toggleHotel(hotelCategory: HotelCategory) {
    setSelectedHotels((current) => current.includes(hotelCategory) ? current.filter((item) => item !== hotelCategory) : [...current, hotelCategory]);
  }

  const fileTitle = `Agent Rate Sheet - ${selectedPackageIds.length} Program${selectedPackageIds.length === 1 ? '' : 's'}`;

  return <Modal open={open} title="Agent Rate Sheet / ใบราคาเอเจนต์" onClose={onClose} wide>
    <div className="agent-rate-builder no-print">
      <div className="agent-rate-builder__intro">
        <div><span>AGENT SALES TOOL</span><h2>สร้างใบราคา Agent จากข้อมูล Pricing ปัจจุบัน</h2><p>เลือกหลายโปรแกรมและหลายระดับโรงแรมได้ในครั้งเดียว ระบบจะคำนวณ Net Agent จากสูตรเดียวกับหน้าคำนวณราคา และแยกแต่ละโปรแกรม/โรงแรมเป็นคนละหน้าใน PDF</p></div>
        <button className="primary-button" disabled={!rows.length} onClick={() => { void printElementAsA4('agent-rate-sheet-print-area', fileTitle); }}><FileText/>ดาวน์โหลด / Print PDF</button>
      </div>
      <div className="agent-rate-builder__grid">
        <section>
          <h3>1. เลือกโปรแกรม</h3>
          <div className="agent-rate-choice-list">{packages.map((pkg) => <button key={pkg.id} className={selectedPackageIds.includes(pkg.id) ? 'active' : ''} onClick={() => togglePackage(pkg.id)}><i>{selectedPackageIds.includes(pkg.id) ? <Check/> : null}</i><span><strong>{pkg.nights + 1} วัน {pkg.nights} คืน</strong><small>{pkg.name}</small></span></button>)}</div>
        </section>
        <section>
          <h3>2. เลือกระดับโรงแรม</h3>
          <div className="agent-rate-hotel-options">{AGENT_RATE_HOTELS.map((hotel) => <button key={hotel} className={selectedHotels.includes(hotel) ? 'active' : ''} onClick={() => toggleHotel(hotel)}><i>{selectedHotels.includes(hotel) ? <Check/> : null}</i>{hotel.replace(' Stars',' ดาว')}</button>)}</div>
          <div className="agent-rate-hotel-notes">
            {selectedHotels.map((hotel) => <label key={hotel}>
              <span>โรงแรม {hotel.replace(' Stars',' ดาว')} สำหรับเอกสาร (ไม่บังคับ)</span>
              <textarea rows={3} value={hotelExamples[hotel]} onChange={(e) => setHotelExamples((current) => ({ ...current, [hotel]: e.target.value }))} placeholder="ปล่อยว่าง = ใช้รายชื่อโรงแรมมาตรฐานของ Bhutan Center อัตโนมัติ"/>
              <small>{hotel === '3 Stars' || hotel === '4 Stars' ? 'ระบบมีรายชื่อโรงแรมมาตรฐานให้แล้ว และจะแสดงเมืองตามโปรแกรมอัตโนมัติ' : '5 ดาวยังไม่มีรายชื่อมาตรฐานในชุดนี้ สามารถกรอกเองได้'}</small>
            </label>)}
          </div>
        </section>
        <section>
          <h3>3. ข้อมูลเอกสาร</h3>
          <label><span>ชื่อ Agent / บริษัท (ไม่บังคับ)</span><input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="เช่น Jasmine Travel"/></label>
          <label><span>ราคาใช้ได้ถึงวันที่ (ไม่บังคับ)</span><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}/></label>
          <label><span>หมายเหตุ</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}/></label>
        </section>
      </div>
      <div className="agent-rate-builder__summary"><strong>{rows.length}</strong><span>หน้าที่จะออกใน PDF</span><small>{selectedPackageIds.length} โปรแกรม × {selectedHotels.length} ระดับโรงแรม</small></div>
    </div>

    <div className="agent-rate-print-stack" id="agent-rate-sheet-print-area">
      {rows.length ? rows.map((row, index) => {
        const customHotels = hotelExamples[row.hotelCategory]?.trim() || '';
        const resolvedHotels = customHotels || getDefaultAgentHotelExamples(row.hotelCategory, row.nights);
        return <AgentRateSheetPage key={`${row.packageId}-${row.hotelCategory}`} row={row} settings={settings} agentName={agentName} validUntil={validUntil} note={note} hotelExamples={resolvedHotels} page={index + 1} totalPages={rows.length}/>;
      }) : <div className="agent-rate-empty">เลือกอย่างน้อย 1 โปรแกรม และ 1 ระดับโรงแรม</div>}
    </div>
  </Modal>;
}

function AgentRateSheetPage({ row, settings, agentName, validUntil, note, hotelExamples, page, totalPages }: {
  row: AgentRateSheetRow;
  settings: GlobalSettings;
  agentName: string;
  validUntil: string;
  note: string;
  hotelExamples: string;
  page: number;
  totalPages: number;
}) {
  const hotelLabel = row.hotelCategory.replace(' Stars', ' ดาว');
  const included = [
    'ตั๋วเครื่องบินไป-กลับ ชั้นประหยัด Bhutan Airlines',
    `ที่พักโรงแรมระดับ ${hotelLabel}`,
    'อาหารทุกมื้อตามโปรแกรม',
    'ไกด์ท้องถิ่นที่สื่อสารภาษาอังกฤษ',
    'ค่าธรรมเนียมรายวันของรัฐบาล (SDF)',
    'ค่าเข้าชมสถานที่ท่องเที่ยวตามโปรแกรม',
    'ค่าธรรมเนียมวีซ่าประเทศภูฏาน',
    'รถรับส่งและโปรแกรมท่องเที่ยวตามกำหนดการ',
    'บริการรับ-ส่งสนามบินพาโร',
    'ประกันการเดินทางแบบระบุวัน',
  ];
  const excluded = [
    'ค่าเช่าม้าขึ้นวัดทักซัง',
    'ค่าทิปไกด์และคนขับรถ',
    'ค่าใช้จ่ายส่วนตัวและรายการอื่นนอกเหนือจากโปรแกรม',
  ];
  return <article className="agent-rate-page">
    <header className="agent-rate-page__header">
      <div><Brand/><small>OMG Experience Co., Ltd. · Bhutan Travel Specialist</small></div>
      <div><span>NET AGENT RATE</span><strong>{page}/{totalPages}</strong></div>
    </header>
    <section className="agent-rate-page__title">
      <span>{agentName.trim() ? `Prepared for: ${agentName.trim()}` : 'AGENT / PARTNER RATE'}</span>
      <h1>ราคาโปรแกรมทัวร์ภูฏาน {row.nights + 1} วัน {row.nights} คืน</h1>
      <h2>พักโรงแรม {hotelLabel} (Net Agent)</h2>
      <p>{row.packageName}</p>
    </section>
    <table className="agent-rate-table">
      <thead><tr><th>รายการ</th><th>ราคา (บาท)</th></tr></thead>
      <tbody>
        <tr><td><b>1. Economy Ticket + Taxes (Bhutan Airlines)</b><small>Agent airfare + airport taxes สำหรับ 1-9 ท่าน</small></td><td>{formatNumber(row.ticketAndTax, 0)}</td></tr>
        <tr><td className="indent">Upgrade Business Class (Optional)</td><td>{formatNumber(row.businessUpgrade, 0)}</td></tr>
        <tr><td><b>2. Land + SDF + Visa (บาท/ท่าน)</b></td><td></td></tr>
        <tr><td className="indent">เดินทาง 1 ท่าน</td><td>{formatNumber(row.landPax1, 0)}</td></tr>
        <tr><td className="indent">เดินทาง 2 ท่าน</td><td>{formatNumber(row.landPax2, 0)}</td></tr>
        <tr><td className="indent">เดินทาง 3 - 9 ท่าน</td><td>{formatNumber(row.landPax3Plus, 0)}</td></tr>
        <tr><td className="indent">GIT 10 PAX+</td><td>On Request</td></tr>
        <tr><td><b>Single Supplement (นอนเดี่ยว)</b></td><td>{row.singleSupplement > 0 ? formatNumber(row.singleSupplement, 0) : 'On Request'}</td></tr>
      </tbody>
    </table>
    <section className="agent-rate-airfare-note">
      <strong>หมายเหตุเรื่องตั๋วเครื่องบิน</strong>
      <p>ราคา Economy Ticket + Taxes ด้านบนเป็นราคารวมตั๋ว Agent + Airport Tax แล้ว โดยค่าโดยสาร Agent พื้นฐานอยู่ที่ ฿{formatNumber(Number(settings.agentTicketPriceTHB ?? 25220), 0)} และ Airport Tax ฿{formatNumber(Number(settings.airportTaxTHB ?? 6500), 0)} / ท่าน</p>
    </section>
    {hotelExamples.trim() && <section className="agent-rate-hotels"><h3>โรงแรมมาตรฐาน {hotelLabel}</h3><p>{hotelExamples}</p></section>}
    <section className="agent-rate-scope">
      <div><h3>ราคารวม</h3><ul>{included.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><h3>ราคาไม่รวม</h3><ul>{excluded.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section>
    <section className="agent-rate-notes">
      <strong>หมายเหตุ</strong>
      <p>{note || 'ราคาสำหรับ Agent เท่านั้น'}</p>
      {validUntil && <p>ราคานี้ใช้ได้ถึงวันที่ {formatDate(validUntil, 'th')}</p>}
      <small>ราคานี้ดึงจากข้อมูล Pricing ของ Bhutan Center ณ วันที่ออกเอกสาร ราคาตั๋ว อัตราแลกเปลี่ยน ภาษี วีซ่า LAND และ Margin อาจเปลี่ยนแปลงได้ตามวันที่ยืนยันการจอง</small>
    </section>
    <footer><strong>Bhutan Center · OMG Experience Co., Ltd.</strong><span>Agent Rate Sheet · {new Date().toLocaleDateString('th-TH')}</span></footer>
  </article>;
}

