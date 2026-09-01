# Bhutan Center SEO & GEO Migration Guard

This project includes an SEO Center based on the Wix SEO Setup Checklist screenshots supplied on 1 Sep 2026.

## Wix baseline imported

- Business / Brand Name: `บริษัท omg experience co.ltd`
- Target keywords:
  - เที่ยวภูฏาน
  - ทัวร์ภูฏาน
  - แพ็กเกจทัวร์ภูฏาน
  - ภูฏานมีอะไรดี
  - ประเทศที่ต้องไปสักครั้งในชีวิต
- Step 1: 7/7 complete
- Step 2: 166/174 complete
- Pages represented in the Wix snapshot: 44
- Outstanding tasks visible in the screenshots: 8

### The 8 Wix items still needing attention

1. TH 4วัน3คืน Journey to Bhutan — internal links
2. P-3 Paro Grand — internal links
3. ที่พักในภูฏาน — image ALT
4. TH 6วัน5คืน The Ultimate Bhutan — internal links
5. ตั๋วเครื่องบิน Bhutan Airlines — image ALT
6. Package bhutan — internal links
7. TH 5วัน4คืน Wonders of Bhutan — internal links
8. Green Season 2026 — internal links

The admin intentionally starts with the same 166/174 baseline so the migration work can continue from the existing Wix state instead of resetting SEO to zero.

## Admin URL

`/admin/seo`

The SEO Center has four areas:

1. **SEO Setup Checklist** — Wix-style Step 1 / Step 2 / Step 3 progress.
2. **Pages & Metadata** — title, meta description, indexability, canonical, keywords, schema and OG image.
3. **Redirect Manager** — 301/308 mapping for URLs that genuinely must change.
4. **SEO & GEO Settings** — Search Console, sitemap, robots, schema and AI/GEO readiness.

## Persistence

Without database variables, edits are saved as a browser draft using `localStorage` so the admin UI can be tested immediately.

For persistent production storage, run:

`supabase/migrations/20260901_seo_center.sql`

Then configure:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BHUTAN_ADMIN_TOKEN`

The service role key is server-only and must never use a `NEXT_PUBLIC_` prefix.

## Ranking protection built into V2

Key URLs verified from the current public Bhutan Center site are preserved with **Next.js rewrites**, so the visible legacy URL can stay unchanged while the new page renders internally:

- `/packagetour-bhutan-new` → new Packages page
- `/bhutan-journey-to-bhutan-3stars` → Journey 4D3N
- `/th5d4n` → Wonders 5D4N
- `/bhutan-the-ultimate-bhutan-3stars` → Ultimate 6D5N
- `/hotelbhutan` → Hotels
- `/how-to-visabhutan` → Visa
- `/bhutan-attractions` → Destinations
- `/bhutan` → About Bhutan
- `/justletyouknow-bhutan` → Before You Go
- `/blog-bhutancenter` → Journal index
- `/packagetours-bhutan-booking` → Booking
- `/contact-us-bhutancenter` → Contact

Do not replace a verified legacy URL with a cleaner new URL just for aesthetics. A URL should only move when there is a real reason, and then it should receive a tested permanent redirect.

## Technical SEO included

- Editable page titles and meta descriptions
- Canonical URLs
- Robots index/noindex control
- `robots.txt`
- automatic `sitemap.xml`
- Open Graph metadata
- TravelAgency / Organization JSON-LD
- per-page schema type selection in admin
- image ALT and internal-link checklist state
- legacy URL lock indicator
- 301/308 redirect rules for unmatched legacy paths
- admin pages set to `noindex`

## Before changing DNS from Wix to Vercel

Do not switch `www.bhutancenter.org` until these are finished:

1. Export or verify the complete Wix URL inventory, not just the 44 pages visible in the screenshots.
2. Record current title, meta description, H1, canonical and indexability for each important URL.
3. Preserve every high-ranking URL where possible.
4. Migrate article/hotel content that currently still exists only on Wix.
5. Test every internal link and image ALT on staging.
6. Validate redirect mappings and make sure there are no redirect chains.
7. Confirm sitemap and robots on staging.
8. Launch, submit the new sitemap in Google Search Console and monitor 404s, indexing, clicks and impressions for at least 30 days.
