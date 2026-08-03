import { GlobalSettings, Hotel, PricingInput, PricingResult, RateByPax, TourPackage } from '../types';

const BUSINESS_UPGRADE_THB = 15000;

function selectPaxRate(rates: RateByPax, passengerCount: number): number {
  if (passengerCount <= 1) return Number(rates.pax1USD || 0);
  if (passengerCount === 2) return Number(rates.pax2USD || 0);
  return Number(rates.pax3PlusUSD || 0);
}

function packageFallbackRate(pkg: TourPackage, category: PricingInput['hotelCategory'], pax: number): number {
  const key = category === '3 Stars' ? 'star3' : category === '4 Stars' ? 'star4' : 'star5';
  const rates = pkg.hotelRates?.[key] || pkg.rates;
  return selectPaxRate(rates, pax);
}

export function calculatePrice(
  input: PricingInput,
  settings: GlobalSettings,
  packages: TourPackage[],
  hotels: Hotel[],
): PricingResult | null {
  const pkg = packages.find((item) => item.id === input.packageId);
  if (!pkg) return null;
  const hotel = hotels.find((item) => item.id === input.hotelId);
  const pax = Math.max(1, input.passengerCount || 1);
  const exchange = Number(settings.exchangeRateUSD || 0);

  // Use the selected hotel's rate first, while keeping package rates as a safe fallback.
  const groundRateUSD = hotel
    ? selectPaxRate(hotel.rates, pax)
    : packageFallbackRate(pkg, input.hotelCategory, pax);

  const groundUSD = groundRateUSD * pkg.nights;
  const groundTHB = groundUSD * exchange;
  const visaUSD = Number(settings.visaFeeUSD || 0);
  const visaTHB = visaUSD * exchange;
  const retailTicket = Number(settings.ticketPriceTHB || 0);
  const agentTicket = Number(settings.agentTicketPriceTHB ?? 25220);
  const hasGroupFlightDiscount = pax >= 10;
  const selectedTicket = input.channel === 'agent' ? agentTicket : retailTicket;
  const airTicket = hasGroupFlightDiscount ? selectedTicket * 0.9 : selectedTicket;
  const tax = Number(settings.airportTaxTHB || 0);
  const margin = input.channel === 'agent' ? Number(settings.agentMarginTHB ?? 3000) : Number(settings.marginTHB || 0);
  const baseCost = airTicket + tax + groundTHB + visaTHB;
  const selling = Math.ceil((baseCost + margin) / 500) * 500;
  const profit = selling - baseCost;
  const upgradeCount = Math.min(Math.max(0, input.businessUpgradeCount || 0), pax);
  const groupSubtotal = selling * pax;
  const upgradeTotal = BUSINESS_UPGRADE_THB * upgradeCount;
  const groupTotal = groupSubtotal + upgradeTotal;

  return {
    channel: input.channel,
    packageName: pkg.name,
    nights: pkg.nights,
    passengerCount: pax,
    hotelName: hotel?.name || input.hotelCategory,
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
    businessUpgradePerPerson: BUSINESS_UPGRADE_THB,
    groupSubtotal,
    businessUpgradeTotal: upgradeTotal,
    groupTotal,
    groupProfit: profit * pax,
    hasGroupFlightDiscount,
  };
}
