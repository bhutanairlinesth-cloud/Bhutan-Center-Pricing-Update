import { CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, PaymentInvoice, PaymentTransaction, TourPackage, User } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { mockDb } from './mockDb';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const BRAND_BUCKET = 'branding';
const BRAND_LOGO_PATH = 'company-logo';
const PAYMENT_SLIP_BUCKET = 'payment-slips';

async function adminUserRequest<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  const response = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'จัดการผู้ใช้งานไม่สำเร็จ');
  return payload as T;
}

function fail(error: any, fallback: string): never {
  throw new Error(error?.message || fallback);
}

function isMissingTable(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist');
}

function mapSettings(row: any): GlobalSettings {
  return {
    exchangeRateUSD: Number(row.exchange_rate_usd),
    ticketPriceTHB: Number(row.ticket_price_thb),
    airportTaxTHB: Number(row.airport_tax_thb),
    visaFeeUSD: Number(row.visa_fee_usd),
    marginTHB: Number(row.margin_thb),
    hotel3StarPax1USD: Number(row.hotel_3_star_pax1_usd),
    hotel3StarPax2USD: Number(row.hotel_3_star_pax2_usd),
    hotel3StarPax3PlusUSD: Number(row.hotel_3_star_pax3_plus_usd),
    hotel4StarPax1USD: Number(row.hotel_4_star_pax1_usd),
    hotel4StarPax2USD: Number(row.hotel_4_star_pax2_usd),
    hotel4StarPax3PlusUSD: Number(row.hotel_4_star_pax3_plus_usd),
    agentTicketPriceTHB: Number(row.agent_ticket_price_thb ?? 25220),
    agentTicketDiscountPercent: Number(row.agent_ticket_discount_percent ?? 3),
    agentMarginTHB: Number(row.agent_margin_thb ?? 3000),
    groupDiscountMinPax: Number(row.group_discount_min_pax ?? 10),
    groupDiscountPercent: Number(row.group_discount_percent ?? 10),
    businessUpgradeTHB: Number(row.business_upgrade_thb ?? 15000),
    logoUrl: String(row.logo_url ?? ''),
  };
}

function settingsRow(settings: GlobalSettings) {
  const agentPrice = settings.agentTicketPriceTHB ?? 25220;
  return {
    id: SETTINGS_ID,
    exchange_rate_usd: settings.exchangeRateUSD,
    ticket_price_thb: settings.ticketPriceTHB,
    airport_tax_thb: settings.airportTaxTHB,
    visa_fee_usd: settings.visaFeeUSD,
    margin_thb: settings.marginTHB,
    hotel_3_star_pax1_usd: settings.hotel3StarPax1USD,
    hotel_3_star_pax2_usd: settings.hotel3StarPax2USD,
    hotel_3_star_pax3_plus_usd: settings.hotel3StarPax3PlusUSD,
    hotel_4_star_pax1_usd: settings.hotel4StarPax1USD,
    hotel_4_star_pax2_usd: settings.hotel4StarPax2USD,
    hotel_4_star_pax3_plus_usd: settings.hotel4StarPax3PlusUSD,
    agent_ticket_price_thb: agentPrice,
    agent_ticket_discount_percent: settings.ticketPriceTHB > 0
      ? Number((((settings.ticketPriceTHB - agentPrice) / settings.ticketPriceTHB) * 100).toFixed(4))
      : 0,
    agent_margin_thb: settings.agentMarginTHB ?? 3000,
    group_discount_min_pax: Math.max(1, Math.round(settings.groupDiscountMinPax ?? 10)),
    group_discount_percent: Math.min(100, Math.max(0, settings.groupDiscountPercent ?? 10)),
    business_upgrade_thb: Math.max(0, settings.businessUpgradeTHB ?? 15000),
    logo_url: settings.logoUrl ?? '',
    updated_at: new Date().toISOString(),
  };
}

const mapHotel = (row: any): Hotel => ({
  id: row.id,
  name: row.name,
  category: row.category,
  rates: {
    pax1USD: Number(row.pax1_usd),
    pax2USD: Number(row.pax2_usd),
    pax3PlusUSD: Number(row.pax3_plus_usd),
  },
});

const hotelRow = (hotel: Hotel) => ({
  id: hotel.id,
  name: hotel.name,
  category: hotel.category,
  pax1_usd: hotel.rates.pax1USD,
  pax2_usd: hotel.rates.pax2USD,
  pax3_plus_usd: hotel.rates.pax3PlusUSD,
  updated_at: new Date().toISOString(),
});

const mapPackage = (row: any): TourPackage => ({
  id: row.id,
  name: row.name,
  nights: Number(row.nights),
  rates: row.rates,
  hotelRates: row.hotel_rates ?? undefined,
  singleSupplementsTHB: row.single_supplements_thb ?? { star3: 0, star4: 0, star5: 0 },
});

const packageRow = (pkg: TourPackage) => ({
  id: pkg.id,
  name: pkg.name,
  nights: pkg.nights,
  rates: pkg.rates,
  hotel_rates: pkg.hotelRates ?? null,
  single_supplements_thb: pkg.singleSupplementsTHB ?? { star3: 0, star4: 0, star5: 0 },
  updated_at: new Date().toISOString(),
});



const mapTracking = (row: any): CustomerTracking => ({
  id: row.id,
  opportunityName: row.opportunity_name || '',
  customerName: row.customer_name || '',
  phone: row.phone || '',
  email: row.email || '',
  leadSource: row.lead_source || 'Other',
  landSupplier: row.land_supplier || '',
  airline: row.airline || '',
  travelStartDate: row.travel_start_date || '',
  travelEndDate: row.travel_end_date || '',
  packageId: row.package_id || '',
  packageName: row.package_name || '',
  hotelCategory: row.hotel_category || '3 Stars',
  passengerCount: Number(row.passenger_count || 1),
  channel: row.channel || 'retail',
  sellingPricePerPerson: Number(row.selling_price_per_person || 0),
  singleRoomCount: Number(row.single_room_count || 0),
  singleSupplementPerPerson: Number(row.single_supplement_per_person || 0),
  singleSupplementTotal: Number(row.single_supplement_total || 0),
  totalAmount: Number(row.total_amount || 0),
  supplementalInvoiceTotal: Number(row.supplemental_invoice_total || 0),
  supplementalCostTotal: Number(row.supplemental_cost_total || 0),
  grandTotalAmount: Number(row.grand_total_amount ?? (Number(row.total_amount || 0) + Number(row.supplemental_invoice_total || 0))),
  travelerAdditions: Array.isArray(row.traveler_additions) ? row.traveler_additions : [],
  ticketPricePerPerson: Number(row.ticket_price_per_person ?? (Number(row.passenger_count || 0) > 0 ? Number(row.ticket_amount || 0) / Number(row.passenger_count) : 0)),
  ticketAmount: Number(row.ticket_amount || 0),
  airportTaxPerPerson: Number(row.airport_tax_per_person ?? (Number(row.passenger_count || 0) > 0 ? Number(row.airport_tax_amount || 0) / Number(row.passenger_count) : 0)),
  airportTaxAmount: Number(row.airport_tax_amount || 0),
  businessUpgradeCount: Number(row.business_upgrade_count || 0),
  businessUpgradePerPerson: Number(row.business_upgrade_per_person ?? 15000),
  businessUpgradeTotal: Number(row.business_upgrade_total || 0),
  additionalItems: Array.isArray(row.additional_items) ? row.additional_items : [],
  additionalItemsTotal: Number(row.additional_items_total || 0),
  landInvoiceNo: row.land_invoice_no || '',
  landInvoiceReceivedAt: row.land_invoice_received_at || '',
  landInvoiceAmountUSD: Number(row.land_invoice_amount_usd || 0),
  landExchangeRate: Number(row.land_exchange_rate || 0),
  landTransferFeeTHB: Number(row.land_transfer_fee_thb || 0),
  landPayment: Number(row.land_payment || 0),
  landPaidAt: row.land_paid_at || '',
  landTransferReference: row.land_transfer_reference || '',
  profitAmount: Number(row.profit_amount || 0),
  depositAmount: Number(row.deposit_amount || 0),
  depositDueDate: row.deposit_due_date || '',
  depositStatus: row.deposit_status || 'pending',
  balanceAmount: Number(row.balance_amount || 0),
  balanceDueDate: row.balance_due_date || '',
  balanceStatus: row.balance_status || 'pending',
  status: row.status || 'new',
  salesOwnerId: row.sales_owner_id || '',
  salesOwnerName: row.sales_owner_name || '',
  note: row.note || '',
  quotationSentAt: row.quotation_sent_at || '',
  bookingConfirmedAt: row.booking_confirmed_at || '',
  passportReceivedAt: row.passport_received_at || '',
  photoReceivedAt: row.photo_received_at || '',
  passengerNames: row.passenger_names || '',
  flightPnr: row.flight_pnr || '',
  flightReservedAt: row.flight_reserved_at || '',
  invoice1SentAt: row.invoice_1_sent_at || '',
  firstPaymentReceivedAt: row.first_payment_received_at || '',
  ticketSentAt: row.ticket_sent_at || '',
  documentsSentToLandAt: row.documents_sent_to_land_at || '',
  invoice2PreparedAt: row.invoice_2_prepared_at || '',
  visaReceivedAt: row.visa_received_at || '',
  visaSentAt: row.visa_sent_at || '',
  fullPaymentReceivedAt: row.full_payment_received_at || '',
  itinerarySentAt: row.itinerary_sent_at || '',
  readyToTravelAt: row.ready_to_travel_at || '',
  tripReturnedAt: row.trip_returned_at || '',
  feedbackRequestedAt: row.feedback_requested_at || '',
  feedbackReceivedAt: row.feedback_received_at || '',
  feedbackNote: row.feedback_note || '',
  nextAction: row.next_action || '',
  nextActionDueDate: row.next_action_due_date || '',
  closedAt: row.closed_at || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const trackingRow = (item: CustomerTracking) => ({
  id: item.id,
  opportunity_name: item.opportunityName,
  customer_name: item.customerName,
  phone: item.phone,
  email: item.email,
  lead_source: item.leadSource,
  land_supplier: item.landSupplier,
  airline: item.airline,
  travel_start_date: item.travelStartDate || null,
  travel_end_date: item.travelEndDate || null,
  package_id: item.packageId || null,
  package_name: item.packageName,
  hotel_category: item.hotelCategory,
  passenger_count: item.passengerCount,
  channel: item.channel,
  selling_price_per_person: item.sellingPricePerPerson,
  single_room_count: Math.max(0, Math.round(item.singleRoomCount || 0)),
  single_supplement_per_person: Math.max(0, item.singleSupplementPerPerson || 0),
  single_supplement_total: Math.max(0, item.singleSupplementTotal || 0),
  total_amount: item.totalAmount,
  supplemental_invoice_total: Math.max(0, item.supplementalInvoiceTotal || 0),
  supplemental_cost_total: Math.max(0, item.supplementalCostTotal || 0),
  grand_total_amount: Math.max(0, item.grandTotalAmount || item.totalAmount || 0),
  traveler_additions: item.travelerAdditions || [],
  ticket_price_per_person: Math.max(0, item.ticketPricePerPerson || 0),
  ticket_amount: item.ticketAmount,
  airport_tax_per_person: Math.max(0, item.airportTaxPerPerson || 0),
  airport_tax_amount: item.airportTaxAmount,
  business_upgrade_count: Math.max(0, Math.round(item.businessUpgradeCount || 0)),
  business_upgrade_per_person: Math.max(0, item.businessUpgradePerPerson || 0),
  business_upgrade_total: Math.max(0, item.businessUpgradeTotal || 0),
  additional_items: item.additionalItems || [],
  additional_items_total: Math.max(0, item.additionalItemsTotal || 0),
  land_invoice_no: item.landInvoiceNo,
  land_invoice_received_at: item.landInvoiceReceivedAt || null,
  land_invoice_amount_usd: Math.max(0, item.landInvoiceAmountUSD || 0),
  land_exchange_rate: Math.max(0, item.landExchangeRate || 0),
  land_transfer_fee_thb: Math.max(0, item.landTransferFeeTHB || 0),
  land_payment: Math.max(0, item.landPayment || 0),
  land_paid_at: item.landPaidAt || null,
  land_transfer_reference: item.landTransferReference,
  profit_amount: item.profitAmount,
  deposit_amount: item.depositAmount,
  deposit_due_date: item.depositDueDate || null,
  deposit_status: item.depositStatus,
  balance_amount: item.balanceAmount,
  balance_due_date: item.balanceDueDate || null,
  balance_status: item.balanceStatus,
  status: item.status,
  sales_owner_id: item.salesOwnerId || null,
  sales_owner_name: item.salesOwnerName,
  note: item.note,
  quotation_sent_at: item.quotationSentAt || null,
  booking_confirmed_at: item.bookingConfirmedAt || null,
  passport_received_at: item.passportReceivedAt || null,
  photo_received_at: item.photoReceivedAt || null,
  passenger_names: item.passengerNames,
  flight_pnr: item.flightPnr,
  flight_reserved_at: item.flightReservedAt || null,
  invoice_1_sent_at: item.invoice1SentAt || null,
  first_payment_received_at: item.firstPaymentReceivedAt || null,
  ticket_sent_at: item.ticketSentAt || null,
  documents_sent_to_land_at: item.documentsSentToLandAt || null,
  invoice_2_prepared_at: item.invoice2PreparedAt || null,
  visa_received_at: item.visaReceivedAt || null,
  visa_sent_at: item.visaSentAt || null,
  full_payment_received_at: item.fullPaymentReceivedAt || null,
  itinerary_sent_at: item.itinerarySentAt || null,
  ready_to_travel_at: item.readyToTravelAt || null,
  trip_returned_at: item.tripReturnedAt || null,
  feedback_requested_at: item.feedbackRequestedAt || null,
  feedback_received_at: item.feedbackReceivedAt || null,
  feedback_note: item.feedbackNote,
  next_action: item.nextAction,
  next_action_due_date: item.nextActionDueDate || null,
  closed_at: item.closedAt || null,
  created_at: item.createdAt,
  updated_at: new Date().toISOString(),
});

const mapInvoice = (row: any): PaymentInvoice => ({
  id: row.id,
  trackingId: row.tracking_id,
  invoiceNo: row.invoice_no,
  installment: row.installment,
  sequenceNumber: Number(row.sequence_no || (row.installment === 'deposit' ? 1 : row.installment === 'balance' ? 2 : 3)),
  title: row.title || '',
  lineItems: Array.isArray(row.line_items) ? row.line_items : [],
  costAmount: Number(row.cost_amount || 0),
  issueDate: row.issue_date || '',
  dueDate: row.due_date || '',
  amount: Number(row.amount || 0),
  status: row.status || 'pending',
  paidAt: row.paid_at || '',
  note: row.note || '',
  documentData: row.document_data && typeof row.document_data === 'object' ? row.document_data : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const invoiceRow = (item: PaymentInvoice) => ({
  id: item.id,
  tracking_id: item.trackingId,
  invoice_no: item.invoiceNo,
  installment: item.installment,
  sequence_no: item.sequenceNumber || (item.installment === 'deposit' ? 1 : item.installment === 'balance' ? 2 : 3),
  title: item.title || '',
  line_items: item.lineItems || [],
  cost_amount: Math.max(0, item.costAmount || 0),
  issue_date: item.issueDate || null,
  due_date: item.dueDate || null,
  amount: item.amount,
  status: item.status,
  paid_at: item.paidAt || null,
  note: item.note,
  document_data: item.documentData || null,
  created_at: item.createdAt,
  updated_at: new Date().toISOString(),
});

const mapPaymentTransaction = (row: any): PaymentTransaction => ({
  id: row.id,
  trackingId: row.tracking_id,
  invoiceId: row.invoice_id || '',
  type: row.type || 'other',
  amount: Number(row.amount || 0),
  paidAt: row.paid_at || '',
  reference: row.reference || '',
  note: row.note || '',
  slipPath: row.slip_path || '',
  slipFileName: row.slip_file_name || '',
  slipMimeType: row.slip_mime_type || '',
  slipSize: Number(row.slip_size || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const paymentTransactionRow = (item: PaymentTransaction) => ({
  id: item.id,
  tracking_id: item.trackingId,
  invoice_id: item.invoiceId || null,
  type: item.type,
  amount: item.amount,
  paid_at: item.paidAt || null,
  reference: item.reference,
  note: item.note,
  slip_path: item.slipPath || null,
  slip_file_name: item.slipFileName || null,
  slip_mime_type: item.slipMimeType || null,
  slip_size: Math.max(0, Number(item.slipSize || 0)),
  created_at: item.createdAt,
  updated_at: new Date().toISOString(),
});

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name || row.email?.split('@')[0] || 'User',
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});


function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('อ่านไฟล์โลโก้ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

export const database = {
  mode: isSupabaseConfigured ? 'supabase' as const : 'local' as const,

  async getSettings(): Promise<GlobalSettings> {
    if (!isSupabaseConfigured) return mockDb.getSettings();
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', SETTINGS_ID).maybeSingle();
    if (error) fail(error, 'โหลดการตั้งค่าไม่สำเร็จ');
    if (!data) throw new Error('ไม่พบข้อมูล app_settings กรุณารัน COMPLETE_SETUP.sql');
    return mapSettings(data);
  },
  async saveSettings(settings: GlobalSettings): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveSettings(settings);
    const { error } = await supabase.from('app_settings').upsert(settingsRow(settings));
    if (error) fail(error, 'บันทึกการตั้งค่าไม่สำเร็จ');
  },

  async uploadBrandLogo(file: File): Promise<string> {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) throw new Error('รองรับเฉพาะไฟล์ PNG, JPG หรือ WEBP');
    if (file.size > 2 * 1024 * 1024) throw new Error('ไฟล์โลโก้ต้องมีขนาดไม่เกิน 2 MB');
    if (!isSupabaseConfigured) return fileToDataUrl(file);

    const { error } = await supabase.storage.from(BRAND_BUCKET).upload(BRAND_LOGO_PATH, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '60',
    });
    if (error) fail(error, 'อัปโหลดโลโก้ไม่สำเร็จ กรุณารัน MIGRATE_BRAND_LOGO.sql ก่อน');
    const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(BRAND_LOGO_PATH);
    return `${data.publicUrl}?v=${Date.now()}`;
  },

  async deleteBrandLogo(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.storage.from(BRAND_BUCKET).remove([BRAND_LOGO_PATH]);
    if (error && !String(error.message || '').toLowerCase().includes('not found')) fail(error, 'ลบโลโก้ไม่สำเร็จ');
  },

  async getHotels(): Promise<Hotel[]> {
    if (!isSupabaseConfigured) return mockDb.getHotels();
    const { data, error } = await supabase.from('hotels').select('*').order('category').order('name');
    if (error) fail(error, 'โหลดโรงแรมไม่สำเร็จ');
    return (data || []).map(mapHotel);
  },
  async saveHotel(hotel: Hotel): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveHotel(hotel);
    const { error } = await supabase.from('hotels').upsert(hotelRow(hotel));
    if (error) fail(error, 'บันทึกโรงแรมไม่สำเร็จ');
  },
  async deleteHotel(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deleteHotel(id);
    const { error } = await supabase.from('hotels').delete().eq('id', id);
    if (error) fail(error, 'ลบโรงแรมไม่สำเร็จ');
  },

  async getPackages(): Promise<TourPackage[]> {
    if (!isSupabaseConfigured) return mockDb.getPackages();
    const { data, error } = await supabase.from('tour_packages').select('*').order('nights');
    if (error) fail(error, 'โหลดโปรแกรมทัวร์ไม่สำเร็จ');
    return (data || []).map(mapPackage);
  },
  async savePackage(pkg: TourPackage): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.savePackage(pkg);
    const { error } = await supabase.from('tour_packages').upsert(packageRow(pkg));
    if (error) fail(error, 'บันทึกโปรแกรมทัวร์ไม่สำเร็จ');
  },
  async deletePackage(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deletePackage(id);
    const { error } = await supabase.from('tour_packages').delete().eq('id', id);
    if (error) fail(error, 'ลบโปรแกรมทัวร์ไม่สำเร็จ');
  },

  async getUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) return mockDb.getUsers();
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) fail(error, 'โหลดผู้ใช้งานไม่สำเร็จ');
    return (data || []).map(mapUser);
  },
  async createUser(input: CreateSystemUserInput): Promise<User> {
    if (!isSupabaseConfigured) {
      const user: User = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      mockDb.saveUser(user);
      return user;
    }
    const payload = await adminUserRequest<{ user: any }>({ action: 'create', ...input });
    return mapUser(payload.user);
  },
  async saveUser(user: User): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveUser(user);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    });
    if (error) fail(error, 'บันทึกผู้ใช้งานไม่สำเร็จ');
  },
  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deleteUser(id);
    await adminUserRequest({ action: 'delete', userId: id });
  },

  async getTrackings(): Promise<CustomerTracking[]> {
    if (!isSupabaseConfigured) return mockDb.getTrackings();
    const { data, error } = await supabase.from('customer_tracking').select('*').order('created_at', { ascending: false });
    if (error) { if (isMissingTable(error)) return []; fail(error, 'โหลดข้อมูลติดตามลูกค้าไม่สำเร็จ'); }
    return (data || []).map(mapTracking);
  },
  async saveTracking(item: CustomerTracking): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveTracking(item);
    const { error } = await supabase.from('customer_tracking').upsert(trackingRow(item));
    if (error) fail(error, 'บันทึกข้อมูลติดตามลูกค้าไม่สำเร็จ');
  },
  async deleteTracking(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deleteTracking(id);
    const { error } = await supabase.from('customer_tracking').delete().eq('id', id);
    if (error) fail(error, 'ลบข้อมูลติดตามลูกค้าไม่สำเร็จ');
  },

  async getInvoices(): Promise<PaymentInvoice[]> {
    if (!isSupabaseConfigured) return mockDb.getInvoices();
    const { data, error } = await supabase.from('payment_invoices').select('*').order('created_at', { ascending: false });
    if (error) { if (isMissingTable(error)) return []; fail(error, 'โหลดเอกสารเรียกเก็บเงินไม่สำเร็จ'); }
    return (data || []).map(mapInvoice);
  },
  async saveInvoice(item: PaymentInvoice): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveInvoice(item);
    const { error } = await supabase.from('payment_invoices').upsert(invoiceRow(item));
    if (error) fail(error, 'บันทึก Invoice ไม่สำเร็จ');
  },
  async deleteInvoice(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deleteInvoice(id);
    const { error } = await supabase.from('payment_invoices').delete().eq('id', id);
    if (error) fail(error, 'ลบ Invoice ไม่สำเร็จ');
  },

  async uploadPaymentSlip(trackingId: string, paymentId: string, file: File): Promise<{ path: string; fileName: string; mimeType: string; size: number }> {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) throw new Error('รองรับสลิปเฉพาะ PNG, JPG, WEBP หรือ PDF');
    if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์สลิปต้องมีขนาดไม่เกิน 10 MB');
    if (!isSupabaseConfigured) {
      return { path: await fileToDataUrl(file), fileName: file.name, mimeType: file.type, size: file.size };
    }
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'payment-slip';
    const path = `${trackingId}/${paymentId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(PAYMENT_SLIP_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: '3600',
    });
    if (error) fail(error, 'อัปโหลดสลิปไม่สำเร็จ');
    return { path, fileName: file.name, mimeType: file.type, size: file.size };
  },
  async getPaymentSlipUrl(path: string): Promise<string> {
    if (!path) throw new Error('ไม่พบไฟล์สลิป');
    if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) return path;
    if (!isSupabaseConfigured) return path;
    const { data, error } = await supabase.storage.from(PAYMENT_SLIP_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) fail(error, 'เปิดไฟล์สลิปไม่สำเร็จ');
    return data.signedUrl;
  },
  async deletePaymentSlip(path: string): Promise<void> {
    if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http') || !isSupabaseConfigured) return;
    const { error } = await supabase.storage.from(PAYMENT_SLIP_BUCKET).remove([path]);
    if (error) fail(error, 'ลบไฟล์สลิปไม่สำเร็จ');
  },

  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    if (!isSupabaseConfigured) return mockDb.getPaymentTransactions();
    const { data, error } = await supabase.from('payment_transactions').select('*').order('paid_at', { ascending: false });
    if (error) { if (isMissingTable(error)) return []; fail(error, 'โหลดประวัติรับชำระไม่สำเร็จ'); }
    return (data || []).map(mapPaymentTransaction);
  },
  async savePaymentTransaction(item: PaymentTransaction): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.savePaymentTransaction(item);
    const { error } = await supabase.from('payment_transactions').upsert(paymentTransactionRow(item));
    if (error) fail(error, 'บันทึกรายการรับชำระไม่สำเร็จ');
  },
  async deletePaymentTransaction(id: string): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.deletePaymentTransaction(id);
    const { data: existing } = await supabase.from('payment_transactions').select('slip_path').eq('id', id).maybeSingle();
    const { error } = await supabase.from('payment_transactions').delete().eq('id', id);
    if (error) fail(error, 'ลบรายการรับชำระไม่สำเร็จ');
    if (existing?.slip_path) {
      const { error: storageError } = await supabase.storage.from(PAYMENT_SLIP_BUCKET).remove([existing.slip_path]);
      if (storageError) console.warn('Unable to remove payment slip:', storageError.message);
    }
  },

};
