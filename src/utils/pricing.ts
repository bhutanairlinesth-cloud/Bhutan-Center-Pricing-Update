import { AdditionalCharge, GlobalSettings, HotelCategory, PricingInput, PricingResult, RateByPax, TourPackage } from '../types';

export function normalizeAdditionalCharges(items: AdditionalCharge[] | null | undefined, passengerCount: number): AdditionalCharge[] {
  const pax = Math.max(1, Math.round(passengerCount || 1));
  return (items || []).map((item, index) => {
    const basis = item.basis || 'custom';
    const quantity = basis === 'per_person'
      ? pax
      : basis === 'per_group'
        ? 1
        : Math.max(0, Number(item.quantity || 0));
    const unitPriceTHB = Math.max(0, Number(item.unitPriceTHB || 0));
    return {
      id: item.id || `extra_${index + 1}`,
      description: String(item.description || '').trim(),
      basis,
      quantity,
      unitPriceTHB,
      totalTHB: Math.round(quantity * unitPriceTHB * 100) / 100,
    };
  }).filter((item) => item.description || item.unitPriceTHB > 0);
}

export function sumAdditionalCharges(items: AdditionalCharge[] | null | undefined, passengerCount: number): number {
  return normalizeAdditionalCharges(items, passengerCount).reduce((sum, item) => sum + item.totalTHB, 0);
}

function selectPaxRate(rates: RateByPax, passengerCount: number): number {
  if (passengerCount <= 1) return Number(rates.pax1USD || 0);
  if (passengerCount === 2) return Number(rates.pax2USD || 0);
  return Number(rates.pax3PlusUSD || 0);
}

function hotelKey(category: HotelCategory): 'star3' | 'star4' | 'star5' {
  if (category === '4 Stars') return 'star4';
  if (category === '5 Stars') return 'star5';
  return 'star3';
}

function packageFallbackRate(pkg: TourPackage, category: HotelCategory, pax: number): number {
  const rates = pkg.hotelRates?.[hotelKey(category)] || pkg.rates;
  return selectPaxRate(rates, pax);
}

function numberOr(value: number | null | undefined, fallback: number): number {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? Math.max(0, Number(value))
    : Math.max(0, fallback);
}

function roundUpToStep(value: number, step = 500): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / step) * step;
}

export interface GroupTLBreakdownInput {
  actualPassengerCount: number;
  chargeablePassengerCount: number;
  regularLandCostPerPerson: number;
  tourLeaderLandCostPerPerson: number;
  ticketPerTraveler: number;
  airportTaxPerTraveler: number;
  marginPerTraveler: number;
  businessUpgradeTotal: number;
  singleSupplementTotal: number;
  additionalItemsTotal: number;
}

export interface GroupTLBreakdown {
  actualPassengerCount: number;
  chargeablePassengerCount: number;
  tourLeaderCount: number;
  regularLandTotal: number;
  tourLeaderLandTotal: number;
  flightTotal: number;
  airportTaxTotal: number;
  marginTotal: number;
  operatingCostTotal: number;
  totalBeforeAverage: number;
  averageBeforeRounding: number;
  sellingPricePerChargeablePerson: number;
  customerTotal: number;
  roundingAdjustment: number;
  groupProfit: number;
}

/**
 * Large-group pricing such as 15 paying travellers + 1 tour leader.
 * The TL receives free accommodation only; their ticket, airport tax and
 * manually entered TL LAND amount are still included. All group costs are
 * pooled and averaged across chargeable travellers.
 */
export function calculateGroupTLBreakdown(input: GroupTLBreakdownInput): GroupTLBreakdown {
  const actualPassengerCount = Math.max(1, Math.round(Number(input.actualPassengerCount || 1)));
  const chargeablePassengerCount = Math.min(
    actualPassengerCount,
    Math.max(1, Math.round(Number(input.chargeablePassengerCount || actualPassengerCount))),
  );
  const tourLeaderCount = Math.max(0, actualPassengerCount - chargeablePassengerCount);
  const regularLandTotal = Math.max(0, Number(input.regularLandCostPerPerson || 0)) * chargeablePassengerCount;
  const tourLeaderLandTotal = Math.max(0, Number(input.tourLeaderLandCostPerPerson || 0)) * tourLeaderCount;
  const flightTotal = Math.max(0, Number(input.ticketPerTraveler || 0)) * actualPassengerCount;
  const airportTaxTotal = Math.max(0, Number(input.airportTaxPerTraveler || 0)) * actualPassengerCount;
  const marginTotal = Math.max(0, Number(input.marginPerTraveler || 0)) * actualPassengerCount;
  // Base group price is averaged across paying travellers. Business Class,
  // single-room supplements and other optional services belong to travellers
  // inside the actual headcount and are added as separate customer line items.
  // Keeping them outside the average prevents a BC upgrade for 6 of 32
  // travellers from being spread across all 30 paying travellers.
  const operatingCostTotal = regularLandTotal
    + tourLeaderLandTotal
    + flightTotal
    + airportTaxTotal;
  const totalBeforeAverage = operatingCostTotal + marginTotal;
  const averageBeforeRounding = totalBeforeAverage / chargeablePassengerCount;
  const sellingPricePerChargeablePerson = roundUpToStep(averageBeforeRounding, 500);
  const optionalSalesTotal = Math.max(0, Number(input.businessUpgradeTotal || 0))
    + Math.max(0, Number(input.singleSupplementTotal || 0))
    + Math.max(0, Number(input.additionalItemsTotal || 0));
  const baseCustomerTotal = sellingPricePerChargeablePerson * chargeablePassengerCount;
  const customerTotal = baseCustomerTotal + optionalSalesTotal;
  const roundingAdjustment = baseCustomerTotal - totalBeforeAverage;
  const groupProfit = customerTotal - operatingCostTotal;
  return {
    actualPassengerCount,
    chargeablePassengerCount,
    tourLeaderCount,
    regularLandTotal,
    tourLeaderLandTotal,
    flightTotal,
    airportTaxTotal,
    marginTotal,
    operatingCostTotal,
    totalBeforeAverage,
    averageBeforeRounding,
    sellingPricePerChargeablePerson,
    customerTotal,
    roundingAdjustment,
    groupProfit,
  };
}

export function getPackageSingleSupplement(pkg: TourPackage | undefined, category: HotelCategory): number {
  if (!pkg) return 0;
  return Math.max(0, Number(pkg.singleSupplementsTHB?.[hotelKey(category)] || 0));
}

export function calculatePrice(
  input: PricingInput,
  settings: GlobalSettings,
  packages: TourPackage[],
): PricingResult | null {
  const pkg = packages.find((item) => item.id === input.packageId);
  if (!pkg) return null;

  const pax = Math.max(1, Math.round(input.passengerCount || 1));
  const pricingMode = input.pricingMode || 'standard';
  const chargeablePassengerCount = pricingMode === 'group_tl'
    ? Math.min(pax, Math.max(1, Math.round(input.chargeablePassengerCount || pax)))
    : pax;
  const tourLeaderCount = Math.max(0, pax - chargeablePassengerCount);
  const exchange = Number(settings.exchangeRateUSD || 0);
  const groundRateUSD = packageFallbackRate(pkg, input.hotelCategory, pax);
  const groundUSD = groundRateUSD * pkg.nights;
  const groundTHB = groundUSD * exchange;
  const visaUSD = Number(settings.visaFeeUSD || 0);
  const visaTHB = visaUSD * exchange;

  const retailTicket = Number(settings.ticketPriceTHB || 0);
  const agentTicket = Number(settings.agentTicketPriceTHB ?? 25220);
  const groupDiscountMinPax = Math.max(1, Math.round(Number(settings.groupDiscountMinPax ?? 10)));
  const groupDiscountPercent = Math.min(100, Math.max(0, Number(settings.groupDiscountPercent ?? 10)));
  const hasGroupFlightDiscount = pricingMode === 'standard' && groupDiscountPercent > 0 && pax >= groupDiscountMinPax;
  const selectedTicket = input.channel === 'agent' ? agentTicket : retailTicket;
  const standardAirTicket = hasGroupFlightDiscount
    ? Math.round(selectedTicket * (1 - groupDiscountPercent / 100))
    : selectedTicket;
  const airTicket = pricingMode === 'group_tl'
    ? numberOr(input.groupTicketPriceOverrideTHB, standardAirTicket)
    : standardAirTicket;

  const standardTax = Number(settings.airportTaxTHB || 0);
  const tax = pricingMode === 'group_tl'
    ? numberOr(input.groupAirportTaxOverrideTHB, standardTax)
    : standardTax;
  const standardMargin = input.channel === 'agent' ? Number(settings.agentMarginTHB ?? 3000) : Number(settings.marginTHB || 0);
  const margin = pricingMode === 'group_tl'
    ? numberOr(input.groupMarginPerTravelerOverrideTHB, standardMargin)
    : standardMargin;

  const upgradeCount = Math.min(Math.max(0, Math.round(input.businessUpgradeCount || 0)), pax);
  const businessUpgradePerPerson = numberOr(input.businessUpgradePriceOverrideTHB, Number(settings.businessUpgradeTHB ?? 15000));
  const businessUpgradeTotal = businessUpgradePerPerson * upgradeCount;

  const singleRoomCount = Math.min(Math.max(0, Math.round(input.singleRoomCount || 0)), pax);
  const packageDefaultSupplement = getPackageSingleSupplement(pkg, input.hotelCategory);
  const singleSupplementPerPerson = numberOr(input.singleSupplementOverrideTHB, packageDefaultSupplement);
  const singleSupplementTotal = singleRoomCount * singleSupplementPerPerson;

  const additionalItems = normalizeAdditionalCharges(input.additionalItems, pax);
  const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + item.totalTHB, 0);

  if (pricingMode === 'group_tl') {
    const regularLandCostPerPerson = numberOr(input.regularLandCostPerPersonOverrideTHB, groundTHB + visaTHB);
    const tourLeaderLandCostPerPerson = numberOr(input.tourLeaderLandCostPerPersonTHB, 0);
    const breakdown = calculateGroupTLBreakdown({
      actualPassengerCount: pax,
      chargeablePassengerCount,
      regularLandCostPerPerson,
      tourLeaderLandCostPerPerson,
      ticketPerTraveler: airTicket,
      airportTaxPerTraveler: tax,
      marginPerTraveler: margin,
      businessUpgradeTotal,
      singleSupplementTotal,
      additionalItemsTotal,
    });
    const recommendedSelling = breakdown.sellingPricePerChargeablePerson;
    const selling = numberOr(input.groupSellingPriceOverrideTHB, recommendedSelling);
    const baseCustomerTotal = selling * chargeablePassengerCount;
    const customerTotal = baseCustomerTotal + businessUpgradeTotal + singleSupplementTotal + additionalItemsTotal;
    const groupProfit = customerTotal - breakdown.operatingCostTotal;
    return {
      channel: input.channel,
      pricingMode,
      packageName: pkg.name,
      nights: pkg.nights,
      passengerCount: pax,
      chargeablePassengerCount,
      tourLeaderCount,
      hotelCategory: input.hotelCategory,
      travelDate: input.travelDate,
      exchangeRate: exchange,
      airTicketPerPerson: airTicket,
      airportTaxPerPerson: tax,
      groundRateUSDPerPersonPerNight: groundRateUSD,
      groundCostUSDPerPerson: groundUSD,
      groundCostTHBPerPerson: regularLandCostPerPerson,
      visaUSDPerPerson: visaUSD,
      visaTHBPerPerson: visaTHB,
      baseCostPerPerson: breakdown.operatingCostTotal / pax,
      marginPerPerson: margin,
      sellingPricePerPerson: selling,
      recommendedSellingPricePerPerson: recommendedSelling,
      profitPerPerson: groupProfit / chargeablePassengerCount,
      businessUpgradeCount: upgradeCount,
      businessUpgradePerPerson,
      groupSubtotal: baseCustomerTotal,
      businessUpgradeTotal,
      singleRoomCount,
      singleSupplementPerPerson,
      singleSupplementTotal,
      additionalItems,
      additionalItemsTotal,
      flightTotal: breakdown.flightTotal,
      airportTaxTotal: breakdown.airportTaxTotal,
      groupTotal: customerTotal,
      groupProfit,
      hasGroupFlightDiscount: false,
      groupDiscountPercentApplied: 0,
      regularLandCostPerPerson,
      tourLeaderLandCostPerPerson,
      regularLandTotal: breakdown.regularLandTotal,
      tourLeaderLandTotal: breakdown.tourLeaderLandTotal,
      groupMarginPerTraveler: margin,
      groupMarginTotal: breakdown.marginTotal,
      operatingCostTotal: breakdown.operatingCostTotal,
      totalBeforeAverage: breakdown.totalBeforeAverage,
      averageBeforeRounding: breakdown.averageBeforeRounding,
      roundingAdjustment: baseCustomerTotal - breakdown.totalBeforeAverage,
    };
  }

  const baseCost = airTicket + tax + groundTHB + visaTHB;
  const selling = roundUpToStep(baseCost + margin, 500);
  const profit = selling - baseCost;
  const groupSubtotal = selling * pax;
  const flightTotal = airTicket * pax;
  const airportTaxTotal = tax * pax;
  const groupTotal = groupSubtotal + businessUpgradeTotal + singleSupplementTotal + additionalItemsTotal;
  const operatingCostTotal = baseCost * pax + businessUpgradeTotal + singleSupplementTotal + additionalItemsTotal;

  return {
    channel: input.channel,
    pricingMode,
    packageName: pkg.name,
    nights: pkg.nights,
    passengerCount: pax,
    chargeablePassengerCount: pax,
    tourLeaderCount: 0,
    hotelCategory: input.hotelCategory,
    travelDate: input.travelDate,
    exchangeRate: exchange,
    airTicketPerPerson: airTicket,
    airportTaxPerPerson: tax,
    groundRateUSDPerPersonPerNight: groundRateUSD,
    groundCostUSDPerPerson: groundUSD,
    groundCostTHBPerPerson: groundTHB,
    visaUSDPerPerson: visaUSD,
    visaTHBPerPerson: visaTHB,
    baseCostPerPerson: baseCost,
    marginPerPerson: margin,
    sellingPricePerPerson: selling,
    recommendedSellingPricePerPerson: selling,
    profitPerPerson: profit,
    businessUpgradeCount: upgradeCount,
    businessUpgradePerPerson,
    groupSubtotal,
    businessUpgradeTotal,
    singleRoomCount,
    singleSupplementPerPerson,
    singleSupplementTotal,
    additionalItems,
    additionalItemsTotal,
    flightTotal,
    airportTaxTotal,
    groupTotal,
    groupProfit: profit * pax,
    hasGroupFlightDiscount,
    groupDiscountPercentApplied: hasGroupFlightDiscount ? groupDiscountPercent : 0,
    regularLandCostPerPerson: groundTHB + visaTHB,
    tourLeaderLandCostPerPerson: 0,
    regularLandTotal: (groundTHB + visaTHB) * pax,
    tourLeaderLandTotal: 0,
    groupMarginPerTraveler: margin,
    groupMarginTotal: margin * pax,
    operatingCostTotal,
    totalBeforeAverage: groupTotal,
    averageBeforeRounding: selling,
    roundingAdjustment: 0,
  };
}
