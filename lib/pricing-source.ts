import { fallbackPackages, TourPackage } from "./packages";
import { getServerSupabase } from "./server-supabase";

type PricingRow = {
  id: string;
  name: string;
  nights: number;
  rates?: any;
  hotel_rates?: any;
};

type SettingsRow = {
  exchange_rate_usd?: number;
  ticket_price_thb?: number;
  airport_tax_thb?: number;
  visa_fee_usd?: number;
  margin_thb?: number;
};

type OverrideRow = {
  package_id: string;
  visible?: boolean;
  price_override_thb?: number | null;
};

function roundUp(value: number, step = 500) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / step) * step;
}

function computeRetailPrice(pkg: PricingRow, settings: SettingsRow) {
  const star3 = pkg.hotel_rates?.star3 || pkg.rates || {};
  const landUsdPerNight = Number(star3.pax2USD ?? star3.pax2_usd ?? 0);
  const exchange = Number(settings.exchange_rate_usd || 0);
  const ground = landUsdPerNight * Number(pkg.nights || 0) * exchange;
  const visa = Number(settings.visa_fee_usd || 0) * exchange;
  const total = Number(settings.ticket_price_thb || 0)
    + Number(settings.airport_tax_thb || 0)
    + ground + visa + Number(settings.margin_thb || 0);
  return roundUp(total, 500);
}

function fallbackFor(row: PricingRow) {
  return fallbackPackages.find((item) => item.nights === Number(row.nights))
    || fallbackPackages.find((item) => row.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]))
    || fallbackPackages[0];
}

export async function getPublicPackages(): Promise<TourPackage[]> {
  const supabase = getServerSupabase();
  if (!supabase) return fallbackPackages;

  try {
    const [{ data: rows, error: packageError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('tour_packages').select('id,name,nights,rates,hotel_rates').order('nights'),
      supabase.from('app_settings').select('exchange_rate_usd,ticket_price_thb,airport_tax_thb,visa_fee_usd,margin_thb').limit(1).maybeSingle(),
    ]);
    if (packageError || settingsError || !rows?.length || !settings) return fallbackPackages;

    let overrides: OverrideRow[] = [];
    const overrideResult = await supabase.from('website_public_prices').select('package_id,visible,price_override_thb');
    if (!overrideResult.error && Array.isArray(overrideResult.data)) overrides = overrideResult.data as OverrideRow[];

    const result: TourPackage[] = (rows as PricingRow[]).map((row) => {
      const base = fallbackFor(row);
      const override = overrides.find((item) => item.package_id === row.id);
      return {
        ...base,
        id: row.id,
        name: base.name,
        nights: Number(row.nights),
        days: Number(row.nights) + 1,
        duration: `${Number(row.nights) + 1} Days / ${Number(row.nights)} Nights`,
        priceFrom: Number(override?.price_override_thb || 0) || computeRetailPrice(row, settings as SettingsRow) || base.priceFrom,
        isActive: override?.visible !== false,
      };
    }).filter((item) => item.isActive);

    return result.length ? result : fallbackPackages;
  } catch (error) {
    console.error('Unified pricing sync failed; using fallback public package data.', error);
    return fallbackPackages;
  }
}

export async function getPublicPackage(slug: string): Promise<TourPackage | undefined> {
  const items = await getPublicPackages();
  return items.find((item) => item.slug === slug);
}
