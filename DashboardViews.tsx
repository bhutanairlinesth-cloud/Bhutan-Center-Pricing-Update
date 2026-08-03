/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Hotel, TourPackage, GlobalSettings } from '../types';

// Default Users (Database seed)
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Bhutan Airlines TH',
    email: 'BhutanairlinesTH@gmail.com',
    role: 'admin',
    createdAt: '2026-06-29T23:04:21-07:00'
  },
  {
    id: 'usr_2',
    name: 'Dechen Wangchuck (Sales)',
    email: 'sales@bhutancenter.com',
    role: 'sales',
    createdAt: '2026-06-29T23:04:21-07:00'
  }
];

// Default Hotels with the user's requested rates per category
const DEFAULT_HOTELS: Hotel[] = [
  {
    id: 'htl_3s_1',
    name: 'Hotel Thimphu Tower',
    category: '3 Stars',
    rates: {
      pax1USD: 250,
      pax2USD: 200,
      pax3PlusUSD: 180
    }
  },
  {
    id: 'htl_3s_2',
    name: 'Phuentsholing Lodge',
    category: '3 Stars',
    rates: {
      pax1USD: 240,
      pax2USD: 190,
      pax3PlusUSD: 170
    }
  },
  {
    id: 'htl_4s_1',
    name: 'Ariana Bhutan Resort',
    category: '4 Stars',
    rates: {
      pax1USD: 300,
      pax2USD: 240,
      pax3PlusUSD: 220
    }
  },
  {
    id: 'htl_4s_2',
    name: 'Zhiwa Ling Heritage',
    category: '4 Stars',
    rates: {
      pax1USD: 320,
      pax2USD: 260,
      pax3PlusUSD: 230
    }
  },
  {
    id: 'htl_5s_1',
    name: 'Taj Tashi Thimphu',
    category: '5 Stars',
    rates: {
      pax1USD: 450,
      pax2USD: 380,
      pax3PlusUSD: 350
    }
  },
  {
    id: 'htl_5s_2',
    name: 'Amankora Paro Lodge',
    category: '5 Stars',
    rates: {
      pax1USD: 550,
      pax2USD: 480,
      pax3PlusUSD: 440
    }
  }
];

// Default Tour Packages
const DEFAULT_PACKAGES: TourPackage[] = [
  {
    id: 'pkg_1',
    name: '4 Days 3 Nights (JOURNEY TO BHUTAN)',
    nights: 3,
    rates: {
      pax1USD: 250,
      pax2USD: 200,
      pax3PlusUSD: 180
    },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 }
    }
  },
  {
    id: 'pkg_2',
    name: '5 Days 4 Nights (WONDERS OF BHUTAN)',
    nights: 4,
    rates: {
      pax1USD: 260,
      pax2USD: 210,
      pax3PlusUSD: 190
    },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 }
    }
  },
  {
    id: 'pkg_3',
    name: '6 Days 5 Nights (THE ULTIMATE BHUTAN)',
    nights: 5,
    rates: {
      pax1USD: 270,
      pax2USD: 220,
      pax3PlusUSD: 200
    },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 }
    }
  }
];

// Default Global Configuration and pricing rates
const DEFAULT_SETTINGS: GlobalSettings = {
  exchangeRateUSD: 35,       // Default 35
  ticketPriceTHB: 26000,     // Default 26,000 THB
  airportTaxTHB: 6500,       // Default 6,500 THB
  visaFeeUSD: 40,            // Default 40 USD
  marginTHB: 5000,           // Default 5,000 THB
  hotel3StarPax1USD: 250,    // 3 Star Hotel 1 Passenger rate
  hotel3StarPax2USD: 200,    // 3 Star Hotel 2 Passengers rate
  hotel3StarPax3PlusUSD: 180,// 3 Star Hotel 3+ Passengers rate
  hotel4StarPax1USD: 300,    // 4 Star Hotel 1 Passenger rate
  hotel4StarPax2USD: 240,    // 4 Star Hotel 2 Passengers rate
  hotel4StarPax3PlusUSD: 220, // 4 Star Hotel 3+ Passengers rate
  agentTicketDiscountPercent: 3, // Default 3% discount
  agentMarginTHB: 3000       // Default 3,000 THB margin
};

const STORAGE_KEYS = {
  USERS: 'bhutan_pricing_users',
  HOTELS: 'bhutan_pricing_hotels',
  PACKAGES: 'bhutan_pricing_packages',
  SETTINGS: 'bhutan_pricing_settings'
};

export const mockDb = {
  // --- USERS ---
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  },

  saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  deleteUser(id: string): void {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  },

  // --- HOTELS ---
  getHotels(): Hotel[] {
    const data = localStorage.getItem(STORAGE_KEYS.HOTELS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(DEFAULT_HOTELS));
      return DEFAULT_HOTELS;
    }
    return JSON.parse(data);
  },

  saveHotel(hotel: Hotel): Hotel {
    const hotels = this.getHotels();
    const index = hotels.findIndex(h => h.id === hotel.id);
    if (index >= 0) {
      hotels[index] = hotel;
    } else {
      hotels.push(hotel);
    }
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
    return hotel;
  },

  deleteHotel(id: string): void {
    const hotels = this.getHotels();
    const filtered = hotels.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(filtered));
  },

  // --- PACKAGES ---
  getPackages(): TourPackage[] {
    const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    let parsed: TourPackage[] = [];
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
      parsed = DEFAULT_PACKAGES;
    } else {
      parsed = JSON.parse(data);
    }

    // Ensure hotelRates exists and name is updated for all standard packages
    let updated = false;
    const migration = parsed.map(pkg => {
      // Migrate names if they are old default names
      if (pkg.id === 'pkg_1' && pkg.name !== '4 Days 3 Nights (JOURNEY TO BHUTAN)') {
        pkg.name = '4 Days 3 Nights (JOURNEY TO BHUTAN)';
        updated = true;
      } else if (pkg.id === 'pkg_2' && pkg.name !== '5 Days 4 Nights (WONDERS OF BHUTAN)') {
        pkg.name = '5 Days 4 Nights (WONDERS OF BHUTAN)';
        updated = true;
      } else if (pkg.id === 'pkg_3' && pkg.name !== '6 Days 5 Nights (THE ULTIMATE BHUTAN)') {
        pkg.name = '6 Days 5 Nights (THE ULTIMATE BHUTAN)';
        updated = true;
      }

      if (!pkg.hotelRates) {
        pkg.hotelRates = {
          star3: {
            pax1USD: pkg.rates?.pax1USD ?? 250,
            pax2USD: pkg.rates?.pax2USD ?? 200,
            pax3PlusUSD: pkg.rates?.pax3PlusUSD ?? 180
          },
          star4: {
            pax1USD: (pkg.rates?.pax1USD ?? 250) + 50,
            pax2USD: (pkg.rates?.pax2USD ?? 200) + 40,
            pax3PlusUSD: (pkg.rates?.pax3PlusUSD ?? 180) + 40
          },
          star5: {
            pax1USD: 500,
            pax2USD: 420,
            pax3PlusUSD: 380
          }
        };
        updated = true;
      }
      return pkg;
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(migration));
      return migration;
    }
    return parsed;
  },

  savePackage(pkg: TourPackage): TourPackage {
    const packages = this.getPackages();
    const index = packages.findIndex(p => p.id === pkg.id);
    if (index >= 0) {
      packages[index] = pkg;
    } else {
      packages.push(pkg);
    }
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    return pkg;
  },

  deletePackage(id: string): void {
    const packages = this.getPackages();
    const filtered = packages.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(filtered));
  },

  // --- SETTINGS ---
  getSettings(): GlobalSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(data);
    // Dynamic migration for Agent Pricing fields if missing
    if (parsed.agentTicketDiscountPercent === undefined || parsed.agentMarginTHB === undefined) {
      const migrated = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        agentTicketDiscountPercent: parsed.agentTicketDiscountPercent !== undefined ? parsed.agentTicketDiscountPercent : 3,
        agentMarginTHB: parsed.agentMarginTHB !== undefined ? parsed.agentMarginTHB : 3000
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  },

  saveSettings(settings: GlobalSettings): GlobalSettings {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // --- UTILITY ---
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(DEFAULT_HOTELS));
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
};
