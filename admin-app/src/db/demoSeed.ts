import { Agent, CustomerTracking, PaymentInvoice, PaymentTransaction, QuotationRecord } from '../types';
import { DEFAULT_DOC_COUNTERS, DocCounterState } from '../shared/docNumber';

export const DEMO_SEED_FLAG = 'bhutan_demo_seeded_v2';

export const DEMO_AGENTS: Agent[] = [
  { id: 'agt_1', code: 'AG-001', name: 'Amazing Travel Bangkok', contactName: 'คุณสมชาย', phone: '081-111-2222', email: 'sales@amazingtravel.co.th', active: true, note: 'Wholesale agent — monthly settlement', createdAt: '2026-01-10T08:00:00.000Z', updatedAt: '2026-01-10T08:00:00.000Z' },
  { id: 'agt_2', code: 'AG-002', name: 'Bhutan Explorer Co.', contactName: 'คุณพิมพ์', phone: '082-333-4444', email: 'booking@bhutanexplorer.com', active: true, note: '', createdAt: '2026-02-01T08:00:00.000Z', updatedAt: '2026-02-01T08:00:00.000Z' },
  { id: 'agt_3', code: 'AG-003', name: 'Inactive Agent Demo', contactName: '-', phone: '', email: '', active: false, note: 'Archived sample', createdAt: '2025-06-01T08:00:00.000Z', updatedAt: '2025-12-01T08:00:00.000Z' },
];

export const DEMO_DOC_COUNTERS: DocCounterState = {
  year: 2026,
  counters: { QT: 3, BK: 2, INV: 4, RC: 2, AG: 3 },
  prefixes: DEFAULT_DOC_COUNTERS.prefixes,
};

function basePricingResult() {
  return {
    channel: 'retail' as const,
    pricingMode: 'standard' as const,
    packageName: '4 Days 3 Nights (JOURNEY TO BHUTAN)',
    nights: 3,
    passengerCount: 2,
    adultPassengerCount: 2,
    childPassengerCount: 0,
    chargeablePassengerCount: 2,
    tourLeaderCount: 0,
    hotelCategory: '4 Stars' as const,
    travelDate: '2026-05-15',
    exchangeRate: 35,
    airTicketPerPerson: 26000,
    airportTaxPerPerson: 6500,
    groundRateUSDPerPersonPerNight: 240,
    groundCostUSDPerPerson: 720,
    groundCostTHBPerPerson: 25200,
    visaUSDPerPerson: 40,
    visaTHBPerPerson: 1400,
    baseCostPerPerson: 59100,
    marginPerPerson: 5000,
    sellingPricePerPerson: 64100,
    recommendedSellingPricePerPerson: 64100,
    childSellingPricePerPerson: 0,
    childTicketPricePerPerson: 0,
    childAirportTaxPerPerson: 0,
    adultSubtotal: 128200,
    childSubtotal: 0,
    profitPerPerson: 5000,
    businessUpgradeCount: 0,
    businessUpgradePerPerson: 15000,
    groupSubtotal: 128200,
    businessUpgradeTotal: 0,
    singleRoomCount: 0,
    singleSupplementPerPerson: 0,
    singleSupplementTotal: 0,
    additionalItems: [],
    additionalItemsTotal: 0,
    flightTotal: 52000,
    airportTaxTotal: 13000,
    groupTotal: 128200,
    groupProfit: 10000,
    hasGroupFlightDiscount: false,
    groupDiscountPercentApplied: 0,
    regularLandCostPerPerson: 25200,
    tourLeaderLandCostPerPerson: 0,
    regularLandTotal: 50400,
    tourLeaderLandTotal: 0,
    groupMarginPerTraveler: 5000,
    groupMarginTotal: 10000,
    operatingCostTotal: 118200,
    totalBeforeAverage: 128200,
    averageBeforeRounding: 64100,
    roundingAdjustment: 0,
  };
}

export const DEMO_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'quote_demo_1', quotationNo: 'QT-2026-0001', status: 'sent', agentId: '', agentName: '',
    customerName: 'คุณวิไล ใจดี', phone: '089-123-4567', email: 'wilai@example.com', invoiceAddress: 'Bangkok', note: 'สนใจ 4D3N ฤดูใบไม้ผลิ',
    channel: 'retail', pricingMode: 'standard', packageId: 'pkg_1', packageName: '4 Days 3 Nights (JOURNEY TO BHUTAN)', hotelCategory: '4 Stars', travelDate: '2026-05-15',
    passengerCount: 2, chargeablePassengerCount: 2, tourLeaderCount: 0, sellingPricePerPerson: 64100, childPassengerCount: 0, childSellingPricePerPerson: 0, totalAmount: 128200,
    pricingInput: { channel: 'retail', pricingMode: 'standard', packageId: 'pkg_1', passengerCount: 2, chargeablePassengerCount: 2, hotelCategory: '4 Stars', travelDate: '2026-05-15', businessUpgradeCount: 0, singleRoomCount: 0, additionalItems: [], childPassengerCount: 0 },
    pricingResult: basePricingResult(), createdById: 'usr_2', createdByName: 'Sales Team', confirmedAt: '', convertedTrackingId: '', createdAt: '2026-03-01T10:00:00.000Z', updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'quote_demo_2', quotationNo: 'QT-2026-0002', status: 'confirmed', agentId: 'agt_1', agentName: 'Amazing Travel Bangkok',
    customerName: 'Group Amazing #42', phone: '02-111-2222', email: 'sales@amazingtravel.co.th', invoiceAddress: 'Bangkok', note: 'Agent wholesale',
    channel: 'agent', pricingMode: 'standard', packageId: 'pkg_2', packageName: '5 Days 4 Nights (WONDERS OF BHUTAN)', hotelCategory: '3 Stars', travelDate: '2026-06-01',
    passengerCount: 8, chargeablePassengerCount: 8, tourLeaderCount: 0, sellingPricePerPerson: 58000, childPassengerCount: 0, childSellingPricePerPerson: 0, totalAmount: 464000,
    pricingInput: { channel: 'agent', pricingMode: 'standard', packageId: 'pkg_2', passengerCount: 8, chargeablePassengerCount: 8, hotelCategory: '3 Stars', travelDate: '2026-06-01', businessUpgradeCount: 0, singleRoomCount: 0, additionalItems: [], childPassengerCount: 0 },
    pricingResult: { ...basePricingResult(), channel: 'agent', packageName: '5 Days 4 Nights (WONDERS OF BHUTAN)', nights: 4, passengerCount: 8, chargeablePassengerCount: 8, sellingPricePerPerson: 58000, groupTotal: 464000 },
    createdById: 'usr_1', createdByName: 'OMG Experience Admin', confirmedAt: '2026-03-05T09:00:00.000Z', convertedTrackingId: 'crm_demo_2', createdAt: '2026-03-02T11:00:00.000Z', updatedAt: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 'quote_demo_3', quotationNo: 'OMG-BH-260310-4821', status: 'lost', agentId: '', agentName: '',
    customerName: 'Legacy Quote Sample', phone: '080-000-0000', email: '', invoiceAddress: '', note: 'Legacy number format (unchanged)',
    channel: 'retail', pricingMode: 'standard', packageId: 'pkg_1', packageName: '4 Days 3 Nights (JOURNEY TO BHUTAN)', hotelCategory: '3 Stars', travelDate: '2026-04-01',
    passengerCount: 2, chargeablePassengerCount: 2, tourLeaderCount: 0, sellingPricePerPerson: 60000, childPassengerCount: 0, childSellingPricePerPerson: 0, totalAmount: 120000,
    pricingInput: { channel: 'retail', pricingMode: 'standard', packageId: 'pkg_1', passengerCount: 2, chargeablePassengerCount: 2, hotelCategory: '3 Stars', travelDate: '2026-04-01', businessUpgradeCount: 0, singleRoomCount: 0, additionalItems: [], childPassengerCount: 0 },
    pricingResult: basePricingResult(), createdById: 'usr_2', createdByName: 'Sales Team', confirmedAt: '', convertedTrackingId: '', createdAt: '2026-03-10T08:00:00.000Z', updatedAt: '2026-03-11T08:00:00.000Z',
  },
];

function trackingBase(overrides: Partial<CustomerTracking>): CustomerTracking {
  const now = '2026-03-10T12:00:00.000Z';
  return {
    id: 'crm_demo_x', bookingNo: 'BK-2026-0001', agentId: '', sourceQuotationId: '', sourceQuotationNo: '', opportunityName: 'Demo', customerName: 'Demo', phone: '', email: '', invoiceAddress: '', leadSource: 'LINE OA', landSupplier: 'Bhutan Land Co.', airline: 'Bhutan Airlines',
    travelStartDate: '2026-05-15', travelEndDate: '2026-05-18', packageId: 'pkg_1', packageName: '4 Days 3 Nights (JOURNEY TO BHUTAN)', hotelCategory: '4 Stars', passengerCount: 2, chargeablePassengerCount: 2, tourLeaderCount: 0, pricingMode: 'standard', channel: 'retail', paymentPlan: 'installments',
    childPassengerCount: 0, childSellingPricePerPerson: 0, childTicketPricePerPerson: 0, childAirportTaxPerPerson: 6500, sellingPricePerPerson: 64100, regularLandCostPerPerson: 25200, tourLeaderLandCostPerPerson: 0, groupMarginPerTraveler: 5000, groupSellingPriceOverridePerPerson: 0, groupPricingCostTotal: 0,
    singleRoomCount: 0, singleSupplementPerPerson: 0, singleSupplementTotal: 0, totalAmount: 128200, supplementalInvoiceTotal: 0, supplementalCostTotal: 0, grandTotalAmount: 128200, travelerAdditions: [],
    ticketPricePerPerson: 26000, ticketAmount: 52000, airportTaxPerPerson: 6500, airportTaxAmount: 13000, businessUpgradeCount: 0, businessUpgradePerPerson: 15000, businessUpgradeTotal: 0, additionalItems: [], additionalItemsTotal: 0,
    landInvoiceNo: '', landInvoiceReceivedAt: '', landInvoiceAmountUSD: 0, landExchangeRate: 35, landTransferFeeTHB: 0, landPayment: 0, landPaidAt: '', landTransferReference: '', profitAmount: 10000,
    depositAmount: 58500, depositDueDate: '2026-03-20', depositStatus: 'pending', balanceAmount: 69700, balanceDueDate: '2026-04-15', balanceStatus: 'pending',
    status: 'new', salesOwnerId: 'usr_2', salesOwnerName: 'Sales Team', note: '', quotationSentAt: '', bookingConfirmedAt: '', passportReceivedAt: '', photoReceivedAt: '', passengerNames: '', flightPnr: '', flightReservedAt: '',
    invoice1SentAt: '', firstPaymentReceivedAt: '', ticketSentAt: '', documentsSentToLandAt: '', invoice2PreparedAt: '', visaReceivedAt: '', visaSentAt: '', fullPaymentReceivedAt: '', itinerarySentAt: '',
    readyToTravelAt: '', tripReturnedAt: '', feedbackRequestedAt: '', feedbackReceivedAt: '', feedbackNote: '', nextAction: '', nextActionDueDate: '', closedAt: '', createdAt: now, updatedAt: now,
    ...overrides,
  };
}

export const DEMO_TRACKINGS: CustomerTracking[] = [
  trackingBase({
    id: 'crm_demo_1', bookingNo: 'BK-2026-0001', opportunityName: 'คุณวิไล — Journey to Bhutan', customerName: 'คุณวิไล ใจดี', phone: '089-123-4567', email: 'wilai@example.com',
    status: 'following', bookingConfirmedAt: '2026-03-08T10:00:00.000Z', passportReceivedAt: '2026-03-09T10:00:00.000Z', invoice1SentAt: '2026-03-09T14:00:00.000Z', depositStatus: 'invoiced',
  }),
  trackingBase({
    id: 'crm_demo_2', bookingNo: 'BK-2026-0002', agentId: 'agt_1', channel: 'agent', opportunityName: 'Amazing Travel Group', customerName: 'Group Amazing #42', phone: '02-111-2222', email: 'sales@amazingtravel.co.th',
    packageId: 'pkg_2', packageName: '5 Days 4 Nights (WONDERS OF BHUTAN)', travelStartDate: '2026-06-01', travelEndDate: '2026-06-05', passengerCount: 8, chargeablePassengerCount: 8, totalAmount: 464000, grandTotalAmount: 464000,
    sourceQuotationId: 'quote_demo_2', sourceQuotationNo: 'QT-2026-0002', status: 'won', bookingConfirmedAt: '2026-03-05T09:00:00.000Z', firstPaymentReceivedAt: '2026-03-06T11:00:00.000Z', depositStatus: 'paid', invoice2PreparedAt: '2026-03-07T09:00:00.000Z', balanceStatus: 'invoiced',
  }),
  trackingBase({
    id: 'crm_demo_3', bookingNo: undefined, opportunityName: 'Legacy booking (no BK no.)', customerName: 'Legacy Customer', phone: '080-999-8888', status: 'lost', closedAt: '2026-02-20T10:00:00.000Z',
  }),
];

export const DEMO_INVOICES: PaymentInvoice[] = [
  { id: 'inv_demo_1', trackingId: 'crm_demo_1', invoiceNo: 'INV-2026-0001', installment: 'deposit', sequenceNumber: 1, title: 'Invoice 1 — Ticket deposit', lineItems: [], costAmount: 45000, issueDate: '2026-03-09', dueDate: '2026-03-20', amount: 58500, status: 'invoiced', paidAt: '', note: '', subtotalAmount: 58500, vatEnabled: false, vatRatePercent: 7, vatAmount: 0, paymentAccountType: 'company', paymentBankName: 'ธนาคารกสิกรไทย', paymentAccountName: 'บริษัท OMG Experience Co., Ltd.', paymentAccountNumber: '051-2-51692-0', paymentQrUrl: '', createdAt: '2026-03-09T14:00:00.000Z', updatedAt: '2026-03-09T14:00:00.000Z' },
  { id: 'inv_demo_2', trackingId: 'crm_demo_2', invoiceNo: 'INV-BH-260306-T1-482', installment: 'deposit', sequenceNumber: 1, title: 'Invoice 1 — Agent group deposit', lineItems: [], costAmount: 180000, issueDate: '2026-03-06', dueDate: '2026-03-10', amount: 232000, status: 'paid', paidAt: '2026-03-06T11:00:00.000Z', note: 'Legacy INV format', subtotalAmount: 232000, vatEnabled: false, vatRatePercent: 7, vatAmount: 0, paymentAccountType: 'company', paymentBankName: 'ธนาคารกสิกรไทย', paymentAccountName: 'บริษัท OMG Experience Co., Ltd.', paymentAccountNumber: '051-2-51692-0', paymentQrUrl: '', createdAt: '2026-03-06T10:00:00.000Z', updatedAt: '2026-03-06T11:00:00.000Z' },
  { id: 'inv_demo_3', trackingId: 'crm_demo_2', invoiceNo: 'INV-2026-0002', installment: 'balance', sequenceNumber: 2, title: 'Invoice 2 — Package balance', lineItems: [], costAmount: 200000, issueDate: '2026-03-07', dueDate: '2026-05-01', amount: 232000, status: 'invoiced', paidAt: '', note: '', subtotalAmount: 216822, vatEnabled: true, vatRatePercent: 7, vatAmount: 15178, paymentAccountType: 'owner', paymentBankName: 'ธนาคารไทยพาณิชย์', paymentAccountName: 'นายศิเวก สัจเดว', paymentAccountNumber: '203-215366-9', paymentQrUrl: '', createdAt: '2026-03-07T09:00:00.000Z', updatedAt: '2026-03-07T09:00:00.000Z' },
  { id: 'inv_demo_4', trackingId: 'crm_demo_2', invoiceNo: 'INV-2026-0003', installment: 'supplemental', sequenceNumber: 3, title: 'Invoice 3 — Service fee VAT', lineItems: [{ id: 'xl1', description: 'ค่าบริการแพ็กเกจ', quantity: 8, unitPriceTHB: 1500, totalTHB: 12000, costPerUnitTHB: 0, totalCostTHB: 0 }], costAmount: 0, issueDate: '2026-03-07', dueDate: '2026-05-01', amount: 12840, status: 'pending', paidAt: '', note: '', subtotalAmount: 12000, vatEnabled: true, vatRatePercent: 7, vatAmount: 840, paymentAccountType: 'company', paymentBankName: 'ธนาคารกสิกรไทย', paymentAccountName: 'บริษัท OMG Experience Co., Ltd.', paymentAccountNumber: '051-2-51692-0', paymentQrUrl: '', createdAt: '2026-03-07T09:30:00.000Z', updatedAt: '2026-03-07T09:30:00.000Z' },
];

export const DEMO_PAYMENTS: PaymentTransaction[] = [
  { id: 'pay_demo_1', trackingId: 'crm_demo_2', receiptNo: 'RC-2026-0001', invoiceId: 'inv_demo_2', type: 'ticket_deposit', amount: 232000, paidAt: '2026-03-06', reference: 'TRF-20260306-001', note: 'Agent transfer', slipPath: '', slipFileName: '', slipMimeType: '', slipSize: 0, createdAt: '2026-03-06T11:00:00.000Z', updatedAt: '2026-03-06T11:00:00.000Z' },
  { id: 'pay_demo_2', trackingId: 'crm_demo_1', receiptNo: 'RC-2026-0002', invoiceId: 'inv_demo_1', type: 'ticket_deposit', amount: 30000, paidAt: '2026-03-10', reference: 'Partial deposit', note: 'Awaiting full deposit', slipPath: '', slipFileName: '', slipMimeType: '', slipSize: 0, createdAt: '2026-03-10T10:00:00.000Z', updatedAt: '2026-03-10T10:00:00.000Z' },
];
