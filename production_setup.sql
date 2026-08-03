/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type HotelCategory = '3 Stars' | '4 Stars' | '5 Stars';

export interface Hotel {
  id: string;
  name: string;
  category: HotelCategory;
  // Rates stored directly with the hotel for clean document/state model
  rates: {
    pax1USD: number;      // 1 Passenger price per night
    pax2USD: number;      // 2 Passengers price per night
    pax3PlusUSD: number;  // 3+ Passengers price per night
  };
}

export interface TourPackage {
  id: string;
  name: string;
  nights: number;
  rates: {
    pax1USD: number;      // 1 Passenger tour price
    pax2USD: number;      // 2 Passengers tour price
    pax3PlusUSD: number;  // 3+ Passengers tour price
  };
  hotelRates?: {
    star3: {
      pax1USD: number;
      pax2USD: number;
      pax3PlusUSD: number;
    };
    star4: {
      pax1USD: number;
      pax2USD: number;
      pax3PlusUSD: number;
    };
    star5: {
      pax1USD: number;
      pax2USD: number;
      pax3PlusUSD: number;
    };
  };
}

export interface GlobalSettings {
  exchangeRateUSD: number;   // USD to THB rate, e.g. 35
  ticketPriceTHB: number;    // Air ticket price (THB)
  airportTaxTHB: number;     // Airport tax (THB)
  visaFeeUSD: number;        // Visa Fee (USD)
  marginTHB: number;         // Margin (THB)
  hotel3StarPax1USD: number; // 3 Star Hotel Pax 1 USD
  hotel3StarPax2USD: number; // 3 Star Hotel Pax 2 USD
  hotel3StarPax3PlusUSD: number; // 3 Star Hotel Pax 3+ USD
  hotel4StarPax1USD: number; // 4 Star Hotel Pax 1 USD
  hotel4StarPax2USD: number; // 4 Star Hotel Pax 2 USD
  hotel4StarPax3PlusUSD: number; // 4 Star Hotel Pax 3+ USD
  agentTicketPriceTHB?: number;         // Agent air ticket price (THB), e.g. 25220
  agentTicketDiscountPercent?: number; // Derived/display discount percent, e.g. 3
  agentMarginTHB?: number;             // Agent profit margin in THB (e.g. 3000)
}

export interface QuotationRequest {
  packageId: string;
  passengerCount: number; // 1 to 10+ (where 10+ is represented as 10)
  hotelCategory: HotelCategory;
  hotelId: string;
  travelDate?: string;
  nationality?: string;
  isAgent?: boolean;
}

export interface QuotationResult {
  airTicketCost: number;     // THB per person
  airportTax: number;        // THB per person
  hotelCostUSD: number;      // USD per night
  hotelCostTHB: number;      // Total THB
  tourCostUSD: number;       // USD total
  tourCostTHB: number;       // THB total
  visaCostUSD: number;       // USD total
  visaCostTHB: number;       // THB total
  totalCostTHB: number;      // Sum of above costs
  marginTHB: number;         // Margin
  sellingPriceTHB: number;   // Total + Margin, rounded up to nearest 500
  profitTHB: number;         // Selling - Total
  isBusinessUpgrade?: boolean;
  businessUpgradeCount?: number;
  businessUpgradeCostTHB?: number;
  hotelCategory?: HotelCategory;
  hasTicketDiscount?: boolean;
  isAgent?: boolean;
}
