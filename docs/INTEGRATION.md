# Bhutan Center Unified Architecture (V13)

Bhutan Center Website and Bhutan Pricing are no longer deployed as separate Vercel projects.

## One repository / one deployment

```text
bhutancenter.org
├─ /                         Next.js public website
├─ /packages/...             SEO public package pages
├─ /admin                    Bhutan Pricing SPA (existing production app)
├─ /api/...                  Shared server routes
└─ Same Supabase project
   ├─ existing Pricing tables
   ├─ Customer Tracking / Quotation / Invoice / Payment
   └─ new Website / LINE / Marketing support tables
```

The existing Pricing source is intentionally kept under `admin-app/` and built unchanged into `/public/admin` before Next.js builds.
This minimizes risk to the production calculator, tracking and document flows while allowing the public website to remain Next.js for SEO.

## Public package price sync

`lib/pricing-source.ts` reads the same `tour_packages` and `app_settings` used by Bhutan Pricing.
For the public starting price it calculates Retail pricing using the 2-pax / 3-star baseline.

If `website_public_prices.price_override_thb` exists for a package, the override wins.
This gives staff two choices:

- leave override blank → public price follows Pricing settings automatically
- set an override → use a marketing display price without modifying cost/margin logic

## Customer / Funnel architecture

Anonymous visitors remain website visitors until the company knows who they are.

```text
Visitor -> Package View -> LINE Click -> LINE Friend / Conversation
                                      -> staff qualifies -> Customer Tracking
                                      -> Quotation -> Invoice -> Paid -> Travel
```

Customer Tracking remains the master sales record. Website events and LINE contacts are supporting data, not duplicate customer records.

## LINE

Public CTA goes through `/go/line` so the system can record the click before opening LINE OA.
If `LINE_OA_BASIC_ID` is configured the chat is prefilled with a website reference.
Webhook endpoint: `/api/line/webhook`.
Broadcast endpoint is protected by existing Supabase staff login and requires Admin role.

## SEO

The public app remains Next.js and keeps:

- Wix legacy URL rewrites
- metadata / canonical
- sitemap.xml
- robots.txt
- structured data
- SEO state persistence foundation

Do not move `bhutancenter.org` from Wix until staging and Search Console migration checks are complete.
