export type UserRole = 'admin' | 'sales';
export type PricingChannel = 'retail' | 'agent';
export type HotelCategory = '3 Stars' | '4 Stars' | '5 Stars';
export type Language = 'th' | 'en';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface RateByPax {
  pax1USD: number;
  pax2USD: number;
  pax3PlusUSD: number;
}

export interface Hotel {
  id: string;
  name: string;
  category: HotelCategory;
  rates: RateByPax;
}

export interface TourPackage {
  id: string;
  name: string;
  nights: number;
  rates: RateByPax;
  hotelRates?: {
    star3: RateByPax;
    star4: RateByPax;
    star5: RateByPax;
  };
}

export interface GlobalSettings {
  exchangeRateUSD: number;
  ticketPriceTHB: number;
  airportTaxTHB: number;
  visaFeeUSD: number;
  marginTHB: number;
  hotel3StarPax1USD: number;
  hotel3StarPax2USD: number;
  hotel3StarPax3PlusUSD: number;
  hotel4StarPax1USD: number;
  hotel4StarPax2USD: number;
  hotel4StarPax3PlusUSD: number;
  agentTicketPriceTHB?: number;
  agentTicketDiscountPercent?: number;
  agentMarginTHB?: number;
  groupDiscountMinPax?: number;
  groupDiscountPercent?: number;
  logoUrl?: string;
}

export interface PricingInput {
  channel: PricingChannel;
  packageId: string;
  passengerCount: number;
  hotelCategory: HotelCategory;
  travelDate: string;
  businessUpgradeCount: number;
}

export interface PricingResult {
  channel: PricingChannel;
  packageName: string;
  nights: number;
  passengerCount: number;
  hotelCategory: HotelCategory;
  travelDate: string;
  exchangeRate: number;
  airTicketPerPerson: number;
  airportTaxPerPerson: number;
  groundRateUSDPerPersonPerNight: number;
  groundCostUSDPerPerson: number;
  groundCostTHBPerPerson: number;
  visaUSDPerPerson: number;
  visaTHBPerPerson: number;
  baseCostPerPerson: number;
  marginPerPerson: number;
  sellingPricePerPerson: number;
  profitPerPerson: number;
  businessUpgradeCount: number;
  businessUpgradePerPerson: number;
  groupSubtotal: number;
  businessUpgradeTotal: number;
  groupTotal: number;
  groupProfit: number;
  hasGroupFlightDiscount: boolean;
  groupDiscountPercentApplied: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  note: string;
}

export type LeadSource = 'LINE OA' | 'LINE' | 'Facebook' | 'Call in' | 'Referral' | 'Walk in' | 'Other';
export type TrackingStatus = 'new' | 'following' | 'quote_sent' | 'won' | 'lost' | 'completed';
export type PaymentStageStatus = 'pending' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceInstallment = 'deposit' | 'balance';

export interface CustomerTracking {
  id: string;
  opportunityName: string;
  customerName: string;
  phone: string;
  email: string;
  leadSource: LeadSource;
  landSupplier: string;
  airline: string;
  travelStartDate: string;
  travelEndDate: string;
  packageId: string;
  packageName: string;
  hotelCategory: HotelCategory;
  passengerCount: number;
  channel: PricingChannel;
  sellingPricePerPerson: number;
  totalAmount: number;
  ticketAmount: number;
  airportTaxAmount: number;
  landPayment: number;
  profitAmount: number;
  depositAmount: number;
  depositDueDate: string;
  depositStatus: PaymentStageStatus;
  balanceAmount: number;
  balanceDueDate: string;
  balanceStatus: PaymentStageStatus;
  status: TrackingStatus;
  salesOwnerId: string;
  salesOwnerName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInvoice {
  id: string;
  trackingId: string;
  invoiceNo: string;
  installment: InvoiceInstallment;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: PaymentStageStatus;
  paidAt: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
