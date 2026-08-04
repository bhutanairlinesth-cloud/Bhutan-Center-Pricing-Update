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
  const hasGroupFlightDiscount = groupDiscountPercent > 0 && pax >= groupDiscountMinPax;
  const selectedTicket = input.channel === 'agent' ? agentTicket : retailTicket;
  const airTicket = hasGroupFlightDiscount
    ? Math.round(selectedTicket * (1 - groupDiscountPercent / 100))
    : selectedTicket;

  const tax = Number(settings.airportTaxTHB || 0);
  const margin = input.channel === 'agent' ? Number(settings.agentMarginTHB ?? 3000) : Number(settings.marginTHB || 0);
  const baseCost = airTicket + tax + groundTHB + visaTHB;
  const selling = Math.ceil((baseCost + margin) / 500) * 500;
  const profit = selling - baseCost;

  const upgradeCount = Math.min(Math.max(0, Math.round(input.businessUpgradeCount || 0)), pax);
  const hasBusinessOverride = input.businessUpgradePriceOverrideTHB !== null
    && input.businessUpgradePriceOverrideTHB !== undefined
    && Number.isFinite(Number(input.businessUpgradePriceOverrideTHB));
  const businessUpgradePerPerson = Math.max(
    0,
    hasBusinessOverride
      ? Number(input.businessUpgradePriceOverrideTHB)
      : Number(settings.businessUpgradeTHB ?? 15000),
  );
  const businessUpgradeTotal = businessUpgradePerPerson * upgradeCount;

  const singleRoomCount = Math.min(Math.max(0, Math.round(input.singleRoomCount || 0)), pax);
  const packageDefaultSupplement = getPackageSingleSupplement(pkg, input.hotelCategory);
  const hasManualSupplement = input.singleSupplementOverrideTHB !== null
    && input.singleSupplementOverrideTHB !== undefined
    && Number.isFinite(Number(input.singleSupplementOverrideTHB));
  const singleSupplementPerPerson = Math.max(
    0,
    hasManualSupplement ? Number(input.singleSupplementOverrideTHB) : packageDefaultSupplement,
  );
  const singleSupplementTotal = singleRoomCount * singleSupplementPerPerson;

  const additionalItems = normalizeAdditionalCharges(input.additionalItems, pax);
  const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + item.totalTHB, 0);
  const groupSubtotal = selling * pax;
  const flightTotal = airTicket * pax;
  const airportTaxTotal = tax * pax;
  const groupTotal = groupSubtotal + businessUpgradeTotal + singleSupplementTotal + additionalItemsTotal;

  return {
    channel: input.channel,
    packageName: pkg.name,
    nights: pkg.nights,
    passengerCount: pax,
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
    // The supplement is treated as a pass-through room cost, not extra profit.
    groupProfit: profit * pax,
    hasGroupFlightDiscount,
    groupDiscountPercentApplied: hasGroupFlightDiscount ? groupDiscountPercent : 0,
  };
}
