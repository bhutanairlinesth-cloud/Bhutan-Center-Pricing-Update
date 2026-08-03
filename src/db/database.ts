import { GlobalSettings, Hotel, TourPackage, User } from '../types';
import { mockDb } from './mockDb';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

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
    agentTicketDiscountPercent: Number(row.agent_ticket_discount_percent ?? 3),
    agentMarginTHB: Number(row.agent_margin_thb ?? 3000),
  };
}

function settingsRow(settings: GlobalSettings) {
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
    agent_ticket_discount_percent: settings.agentTicketDiscountPercent ?? 3,
    agent_margin_thb: settings.agentMarginTHB ?? 3000,
    updated_at: new Date().toISOString(),
  };
}

const mapHotel = (row: any): Hotel => ({
  id: row.id,
  name: row.name,
  category: row.category,
  rates: { pax1USD: Number(row.pax1_usd), pax2USD: Number(row.pax2_usd), pax3PlusUSD: Number(row.pax3_plus_usd) },
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
  hotelRates: row.hotel_rates,
});

const packageRow = (pkg: TourPackage) => ({
  id: pkg.id,
  name: pkg.name,
  nights: pkg.nights,
  rates: pkg.rates,
  hotel_rates: pkg.hotelRates ?? null,
  updated_at: new Date().toISOString(),
});

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name || row.email?.split('@')[0] || 'User',
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

function fail(error: any, fallback: string): never {
  throw new Error(error?.message || fallback);
}

export const database = {
  mode: isSupabaseConfigured ? 'supabase' as const : 'local' as const,

  async getSettings(): Promise<GlobalSettings> {
    if (!isSupabaseConfigured) return mockDb.getSettings();
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', SETTINGS_ID).maybeSingle();
    if (error) fail(error, 'โหลดการตั้งค่าไม่สำเร็จ');
    if (!data) throw new Error('ไม่พบ app_settings กรุณารัน schema.sql');
    return mapSettings(data);
  },

  async saveSettings(settings: GlobalSettings): Promise<void> {
    if (!isSupabaseConfigured) return void mockDb.saveSettings(settings);
    const { error } = await supabase.from('app_settings').upsert(settingsRow(settings));
    if (error) fail(error, 'บันทึกการตั้งค่าไม่สำเร็จ');
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
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) fail(error, 'ลบผู้ใช้งานไม่สำเร็จ');
  },
};
