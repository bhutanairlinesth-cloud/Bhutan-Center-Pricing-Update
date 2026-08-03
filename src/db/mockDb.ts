import { GlobalSettings, Hotel, TourPackage, User } from '../types';

const DEFAULT_USERS: User[] = [
  { id: 'usr_1', name: 'OMG Experience Admin', email: 'info@omgexp.com', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'usr_2', name: 'Sales Team', email: 'sales@omgexp.com', role: 'sales', createdAt: new Date().toISOString() },
];

const DEFAULT_HOTELS: Hotel[] = [
  { id: 'htl_3s_1', name: 'Hotel Thimphu Tower', category: '3 Stars', rates: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 } },
  { id: 'htl_3s_2', name: 'Phuentsholing Lodge', category: '3 Stars', rates: { pax1USD: 240, pax2USD: 190, pax3PlusUSD: 170 } },
  { id: 'htl_4s_1', name: 'Ariana Bhutan Resort', category: '4 Stars', rates: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 } },
  { id: 'htl_4s_2', name: 'Zhiwa Ling Heritage', category: '4 Stars', rates: { pax1USD: 320, pax2USD: 260, pax3PlusUSD: 230 } },
  { id: 'htl_5s_1', name: 'Taj Tashi Thimphu', category: '5 Stars', rates: { pax1USD: 450, pax2USD: 380, pax3PlusUSD: 350 } },
  { id: 'htl_5s_2', name: 'Amankora Paro Lodge', category: '5 Stars', rates: { pax1USD: 550, pax2USD: 480, pax3PlusUSD: 440 } },
];

const DEFAULT_PACKAGES: TourPackage[] = [
  {
    id: 'pkg_1', name: '4 Days 3 Nights (JOURNEY TO BHUTAN)', nights: 3,
    rates: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 },
    },
  },
  {
    id: 'pkg_2', name: '5 Days 4 Nights (WONDERS OF BHUTAN)', nights: 4,
    rates: { pax1USD: 260, pax2USD: 210, pax3PlusUSD: 190 },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 },
    },
  },
  {
    id: 'pkg_3', name: '6 Days 5 Nights (THE ULTIMATE BHUTAN)', nights: 5,
    rates: { pax1USD: 270, pax2USD: 220, pax3PlusUSD: 200 },
    hotelRates: {
      star3: { pax1USD: 250, pax2USD: 200, pax3PlusUSD: 180 },
      star4: { pax1USD: 300, pax2USD: 240, pax3PlusUSD: 220 },
      star5: { pax1USD: 500, pax2USD: 420, pax3PlusUSD: 380 },
    },
  },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  exchangeRateUSD: 35,
  ticketPriceTHB: 26000,
  airportTaxTHB: 6500,
  visaFeeUSD: 40,
  marginTHB: 5000,
  hotel3StarPax1USD: 250,
  hotel3StarPax2USD: 200,
  hotel3StarPax3PlusUSD: 180,
  hotel4StarPax1USD: 300,
  hotel4StarPax2USD: 240,
  hotel4StarPax3PlusUSD: 220,
  agentTicketPriceTHB: 25220,
  agentTicketDiscountPercent: 3,
  agentMarginTHB: 3000,
};

const KEYS = {
  users: 'bhutan_v10_users',
  hotels: 'bhutan_v10_hotels',
  packages: 'bhutan_v10_packages',
  settings: 'bhutan_v10_settings',
};

function read<T>(key: string, fallback: T): T {
  const current = localStorage.getItem(key);
  if (!current) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try { return JSON.parse(current) as T; } catch { return fallback; }
}

export const mockDb = {
  getUsers: () => read<User[]>(KEYS.users, DEFAULT_USERS),
  saveUser(user: User) {
    const list = this.getUsers();
    const index = list.findIndex((x) => x.id === user.id);
    if (index >= 0) list[index] = user; else list.push(user);
    localStorage.setItem(KEYS.users, JSON.stringify(list));
  },
  deleteUser(id: string) { localStorage.setItem(KEYS.users, JSON.stringify(this.getUsers().filter((x) => x.id !== id))); },

  getHotels: () => read<Hotel[]>(KEYS.hotels, DEFAULT_HOTELS),
  saveHotel(hotel: Hotel) {
    const list = this.getHotels();
    const index = list.findIndex((x) => x.id === hotel.id);
    if (index >= 0) list[index] = hotel; else list.push(hotel);
    localStorage.setItem(KEYS.hotels, JSON.stringify(list));
  },
  deleteHotel(id: string) { localStorage.setItem(KEYS.hotels, JSON.stringify(this.getHotels().filter((x) => x.id !== id))); },

  getPackages: () => read<TourPackage[]>(KEYS.packages, DEFAULT_PACKAGES),
  savePackage(pkg: TourPackage) {
    const list = this.getPackages();
    const index = list.findIndex((x) => x.id === pkg.id);
    if (index >= 0) list[index] = pkg; else list.push(pkg);
    localStorage.setItem(KEYS.packages, JSON.stringify(list));
  },
  deletePackage(id: string) { localStorage.setItem(KEYS.packages, JSON.stringify(this.getPackages().filter((x) => x.id !== id))); },

  getSettings: () => ({ ...DEFAULT_SETTINGS, ...read<GlobalSettings>(KEYS.settings, DEFAULT_SETTINGS) }),
  saveSettings(settings: GlobalSettings) { localStorage.setItem(KEYS.settings, JSON.stringify(settings)); },
};
