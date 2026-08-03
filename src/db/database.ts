import { GlobalSettings, Hotel, TourPackage, User } from '../types';
import { mockDb } from './mockDb';
import { deleteRows, isSupabaseConfigured, selectRows, upsertRows } from '../lib/supabase';

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

function mapHotel(row: any): Hotel {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    rates: {
      pax1USD: Number(row.pax1_usd),
      pax2USD: Number(row.pax2_usd),
      pax3PlusUSD: Number(row.pax3_plus_usd),
    },
  };
}

function hotelRow(hotel: Hotel) {
  return {
    id: hotel.id,
    name: hotel.name,
    category: hotel.category,
    pax1_usd: hotel.rates.pax1USD,
    pax2_usd: hotel.rates.pax2USD,
    pax3_plus_usd: hotel.rates.pax3PlusUSD,
    updated_at: new Date().toISOString(),
  };
}

function mapPackage(row: any): TourPackage {
  return {
    id: row.id,
    name: row.name,
    nights: Number(row.nights),
    rates: row.rates,
    hotelRates: row.hotel_rates,
  };
}

function packageRow(pkg: TourPackage) {
  return {
    id: pkg.id,
    name: pkg.name,
    nights: pkg.nights,
    rates: pkg.rates,
    hotel_rates: pkg.hotelRates ?? null,
    updated_at: new Date().toISOString(),
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name || row.email?.split('@')[0] || 'User',
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export const database = {
  mode: isSupabaseConfigured ? 'supabase' as const : 'local' as const,

  async getSettings(): Promise<GlobalSettings> {
    if (!isSupabaseConfigured) return mockDb.getSettings();
    const rows = await selectRows('app_settings', `id=eq.${SETTINGS_ID}&select=*`);
    if (!rows[0]) throw new Error('ไม่พบ app_settings');
    return mapSettings(rows[0]);
  },

  async saveSettings(settings: GlobalSettings): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.saveSettings(settings); return; }
    await upsertRows('app_settings', settingsRow(settings));
  },

  async getHotels(): Promise<Hotel[]> {
    if (!isSupabaseConfigured) return mockDb.getHotels();
    const rows = await selectRows('hotels', 'select=*&order=category.asc,name.asc');
    return rows.map(mapHotel);
  },

  async saveHotel(hotel: Hotel): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.saveHotel(hotel); return; }
    await upsertRows('hotels', hotelRow(hotel));
  },

  async deleteHotel(id: string): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.deleteHotel(id); return; }
    await deleteRows('hotels', `id=eq.${encodeURIComponent(id)}`);
  },

  async getPackages(): Promise<TourPackage[]> {
    if (!isSupabaseConfigured) return mockDb.getPackages();
    const rows = await selectRows('tour_packages', 'select=*&order=nights.asc');
    return rows.map(mapPackage);
  },

  async savePackage(pkg: TourPackage): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.savePackage(pkg); return; }
    await upsertRows('tour_packages', packageRow(pkg));
  },

  async deletePackage(id: string): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.deletePackage(id); return; }
    await deleteRows('tour_packages', `id=eq.${encodeURIComponent(id)}`);
  },

  async getUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) return mockDb.getUsers();
    const rows = await selectRows('profiles', 'select=*&order=created_at.asc');
    return rows.map(mapUser);
  },

  async saveUser(user: User): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.saveUser(user); return; }
    await upsertRows('profiles', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    });
  },

  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) { mockDb.deleteUser(id); return; }
    await deleteRows('profiles', `id=eq.${encodeURIComponent(id)}`);
  },
};
