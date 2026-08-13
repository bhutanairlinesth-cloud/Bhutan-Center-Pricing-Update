export type UserRole = 'admin' | 'sales';
export type PricingChannel = 'retail' | 'agent';
export type PricingMode = 'standard' | 'group_tl';
export type PaymentPlan = 'installments' | 'full_payment' | 'custom';
export type HotelCategory = '3 Stars' | '4 Stars' | '5 Stars';
export type Language = 'th' | 'en';
export type AdditionalChargeBasis = 'per_person' | 'per_group' | 'custom';

export interface AdditionalCharge {
  id: string;
  description: string;
  basis: AdditionalChargeBasis;
  quantity: number;
  unitPriceTHB: number;
  totalTHB: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateSystemUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RateByPax {
  pax1USD: number;
  pax2USD: number;
  pax3PlusUSD: number;
}

export interface SingleSupplementsTHB {
  star3: number;
  star4: number;
  star5: number;
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
  /** Single-room surcharge per traveller for the whole package, in THB. */
  singleSupplementsTHB?: SingleSupplementsTHB;
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
  businessUpgradeTHB?: number;
  logoUrl?: string;
  companyBankName?: string;
  companyAccountName?: string;
  companyAccountNumber?: string;
  companyPaymentQrUrl?: string;
  ownerBankName?: string;
  ownerAccountName?: string;
  ownerAccountNumber?: string;
  ownerPaymentQrUrl?: string;
  vatRatePercent?: number;
}

export interface PricingInput {
  channel: PricingChannel;
  pricingMode: PricingMode;
  packageId: string;
  /** Actual travellers, including tour leaders. */
  passengerCount: number;
  /** Travellers who are billed. Equals passengerCount for standard pricing. */
  chargeablePassengerCount: number;
  hotelCategory: HotelCategory;
  travelDate: string;
  businessUpgradeCount: number;
  /** Optional manual Business Class surcharge per upgraded traveller. */
  businessUpgradePriceOverrideTHB?: number | null;
  /** Number of travellers who require a private single room. */
  singleRoomCount: number;
  /** Optional manual override. null/undefined uses the package default. */
  singleSupplementOverrideTHB?: number | null;
  /** Flexible extra services such as hotel upgrades, mask dance, baggage vehicle, etc. */
  additionalItems: AdditionalCharge[];
  /** Large-group / TL pricing inputs. All values are THB per traveller. */
  regularLandCostPerPersonOverrideTHB?: number | null;
  tourLeaderLandCostPerPersonTHB?: number | null;
  groupTicketPriceOverrideTHB?: number | null;
  groupAirportTaxOverrideTHB?: number | null;
  groupMarginPerTravelerOverrideTHB?: number | null;
  /** Optional final selling price per paying traveller after averaging. */
  groupSellingPriceOverrideTHB?: number | null;
}

export interface PricingResult {
  channel: PricingChannel;
  pricingMode: PricingMode;
  packageName: string;
  nights: number;
  /** Actual travellers, including TL. */
  passengerCount: number;
  /** Travellers who are billed. */
  chargeablePassengerCount: number;
  tourLeaderCount: number;
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
  recommendedSellingPricePerPerson: number;
  profitPerPerson: number;
  businessUpgradeCount: number;
  businessUpgradePerPerson: number;
  groupSubtotal: number;
  businessUpgradeTotal: number;
  singleRoomCount: number;
  singleSupplementPerPerson: number;
  singleSupplementTotal: number;
  additionalItems: AdditionalCharge[];
  additionalItemsTotal: number;
  flightTotal: number;
  airportTaxTotal: number;
  groupTotal: number;
  groupProfit: number;
  hasGroupFlightDiscount: boolean;
  groupDiscountPercentApplied: number;
  regularLandCostPerPerson: number;
  tourLeaderLandCostPerPerson: number;
  regularLandTotal: number;
  tourLeaderLandTotal: number;
  groupMarginPerTraveler: number;
  groupMarginTotal: number;
  operatingCostTotal: number;
  totalBeforeAverage: number;
  averageBeforeRounding: number;
  roundingAdjustment: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  /** Optional billing / invoice address. */
  invoiceAddress: string;
  note: string;
}

export type LeadSource = 'LINE OA' | 'LINE' | 'Facebook' | 'Call in' | 'Referral' | 'Walk in' | 'Other';
export type TrackingStatus = 'new' | 'following' | 'quote_sent' | 'won' | 'lost' | 'completed';
export type JourneyStage = 'lead' | 'quotation_sent' | 'booking_confirmed' | 'flight_reserved' | 'invoice_1_sent' | 'first_payment_received' | 'ticket_sent' | 'documents_sent_to_land' | 'land_invoice_received' | 'invoice_2_ready' | 'visa_received' | 'visa_sent' | 'full_payment_received' | 'land_payment_pending' | 'land_paid' | 'itinerary_sent' | 'ready_to_travel' | 'traveling' | 'returned' | 'feedback_requested' | 'feedback_received' | 'closed' | 'cancelled';
export type PaymentTransactionType = 'ticket_deposit' | 'package_balance' | 'full_payment' | 'supplemental' | 'refund' | 'other';
export type PaymentStageStatus = 'pending' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceInstallment = 'deposit' | 'balance' | 'full' | 'supplemental';
export type PaymentAccountType = 'company' | 'owner';


export interface SupplementalInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPriceTHB: number;
  totalTHB: number;
  /** Internal cost, never shown on the customer invoice. */
  costPerUnitTHB: number;
  totalCostTHB: number;
}


export interface TravelerAddition {
  id: string;
  addedAt: string;
  passengerCount: number;
  passengerNames: string;
  pnr: string;
  airline: string;
  /** Full package selling price per added traveller. This already includes the airfare/tax component. */
  packagePricePerPerson: number;
  /** Internal costs used for margin reporting and name-verification details. */
  ticketPricePerPerson: number;
  airportTaxPerPerson: number;
  /** @deprecated LAND cost is consolidated later from the supplier invoice and is ignored for added travellers. */
  landCostPerPerson?: number;
  businessUpgradeCount: number;
  businessUpgradePerPerson: number;
  singleRoomCount: number;
  singleSupplementPerPerson: number;
  singleSupplementCostPerPerson: number;
  extraLines: SupplementalInvoiceLine[];
  /** Full added-package sales value that will be consolidated into Invoice 2. */
  customerChargeTotal: number;
  /** Ticket + airport-tax amount collected first for this added group. */
  ticketDepositTotal?: number;
  internalCostTotal: number;
  invoiceId: string;
  note: string;
  status: 'active' | 'cancelled';
}

export interface CustomerTracking {
  id: string;
  opportunityName: string;
  customerName: string;
  phone: string;
  email: string;
  /** Optional billing / invoice address. */
  invoiceAddress: string;
  leadSource: LeadSource;
  landSupplier: string;
  airline: string;
  travelStartDate: string;
  travelEndDate: string;
  packageId: string;
  packageName: string;
  hotelCategory: HotelCategory;
  /** Actual travellers, including tour leaders. */
  passengerCount: number;
  /** Travellers billed on the quotation / package invoice. */
  chargeablePassengerCount: number;
  tourLeaderCount: number;
  pricingMode: PricingMode;
  channel: PricingChannel;
  /** How this customer will be billed: normal 2-stage, one-time full payment, or manual/custom. */
  paymentPlan: PaymentPlan;
  sellingPricePerPerson: number;
  regularLandCostPerPerson: number;
  tourLeaderLandCostPerPerson: number;
  groupMarginPerTraveler: number;
  groupSellingPriceOverridePerPerson: number;
  groupPricingCostTotal: number;
  singleRoomCount: number;
  singleSupplementPerPerson: number;
  singleSupplementTotal: number;
  /** Original package value used by Invoice 1 and Invoice 2. */
  totalAmount: number;
  /** Sum of active Invoice 3+ documents. */
  supplementalInvoiceTotal: number;
  /** Internal costs of Invoice 3+ services. */
  supplementalCostTotal: number;
  /** Package total + active Invoice 3+ documents. */
  grandTotalAmount: number;
  /** Travellers added after the original ticketing flow, linked to Invoice 3+. */
  travelerAdditions: TravelerAddition[];
  ticketPricePerPerson: number;
  ticketAmount: number;
  airportTaxPerPerson: number;
  airportTaxAmount: number;
  businessUpgradeCount: number;
  businessUpgradePerPerson: number;
  businessUpgradeTotal: number;
  additionalItems: AdditionalCharge[];
  additionalItemsTotal: number;
  landInvoiceNo: string;
  landInvoiceReceivedAt: string;
  landInvoiceAmountUSD: number;
  landExchangeRate: number;
  landTransferFeeTHB: number;
  landPayment: number;
  landPaidAt: string;
  landTransferReference: string;
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
  quotationSentAt: string;
  bookingConfirmedAt: string;
  passportReceivedAt: string;
  photoReceivedAt: string;
  passengerNames: string;
  flightPnr: string;
  flightReservedAt: string;
  invoice1SentAt: string;
  firstPaymentReceivedAt: string;
  ticketSentAt: string;
  documentsSentToLandAt: string;
  invoice2PreparedAt: string;
  visaReceivedAt: string;
  visaSentAt: string;
  fullPaymentReceivedAt: string;
  itinerarySentAt: string;
  readyToTravelAt: string;
  tripReturnedAt: string;
  feedbackRequestedAt: string;
  feedbackReceivedAt: string;
  feedbackNote: string;
  nextAction: string;
  nextActionDueDate: string;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  trackingId: string;
  /** Optional link to Invoice 3+ for separate payment tracking. */
  invoiceId: string;
  type: PaymentTransactionType;
  amount: number;
  paidAt: string;
  reference: string;
  note: string;
  slipPath: string;
  slipFileName: string;
  slipMimeType: string;
  slipSize: number;
  createdAt: string;
  updatedAt: string;
}


export interface InvoicePackageLineSnapshot {
  id: string;
  descriptionTh: string;
  descriptionEn: string;
  detailTh: string;
  detailEn: string;
  ptc: string;
  quantity: number;
  unitPriceTHB: number;
  totalTHB: number;
}

export interface InvoiceTicketFareLineSnapshot {
  cabinClass: 'Economy' | 'Business';
  passengerCount: number;
  farePerPersonTHB: number;
  airportTaxPerPersonTHB: number;
  totalPerPersonTHB: number;
  totalTHB: number;
}

export interface InvoiceTicketBatchSnapshot {
  batchLabelTh: string;
  batchLabelEn: string;
  passengerCount: number;
  passengerNames: string[];
  pnr: string;
  airline: string;
  cabinClass: string;
  farePerPersonTHB: number;
  airportTaxPerPersonTHB: number;
  fareTotalTHB: number;
  airportTaxTotalTHB: number;
  totalDueTHB: number;
  /** Optional split for mixed Economy / Business groups. */
  fareLines?: InvoiceTicketFareLineSnapshot[];
}

export interface InvoiceDeductionSnapshot {
  id: string;
  labelTh: string;
  labelEn: string;
  amountTHB: number;
  reference: string;
}

export interface InvoiceDocumentSnapshot {
  version: number;
  kind: 'ticket_original' | 'ticket_added' | 'package_balance' | 'full_payment' | 'supplemental';
  packageRows: InvoicePackageLineSnapshot[];
  packageTotalTHB: number;
  totalPassengerCount: number;
  ticketBatch?: InvoiceTicketBatchSnapshot;
  deductions?: InvoiceDeductionSnapshot[];
  balanceDueTHB?: number;
  capturedAt: string;
}

export interface PaymentInvoice {
  id: string;
  trackingId: string;
  invoiceNo: string;
  installment: InvoiceInstallment;
  /** 1, 2, 3... shown to staff and customers. */
  sequenceNumber: number;
  title: string;
  lineItems: SupplementalInvoiceLine[];
  /** Internal cost used for future profit dashboards. */
  costAmount: number;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: PaymentStageStatus;
  paidAt: string;
  note: string;
  /** Base amount before VAT. For old invoices this falls back to amount. */
  subtotalAmount: number;
  /** VAT is only used when a customer requests a tax invoice (normally Invoice 2). */
  vatEnabled: boolean;
  vatRatePercent: number;
  vatAmount: number;
  /** Bank account selected for this invoice. Details are snapshotted so old documents do not change. */
  paymentAccountType: PaymentAccountType;
  paymentBankName: string;
  paymentAccountName: string;
  paymentAccountNumber: string;
  paymentQrUrl: string;
  /** Immutable customer-facing values captured when the invoice is issued. */
  documentData?: InvoiceDocumentSnapshot | null;
  createdAt: string;
  updatedAt: string;
}
