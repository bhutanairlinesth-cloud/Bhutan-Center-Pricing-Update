# Bhutan Center Unified V13.6 — Google Analytics & Ads Foundation

แพตช์นี้เพิ่ม Google Measurement เข้า Marketing Center โดยไม่เปิดใช้งาน tag ใด ๆ จนกว่าจะใส่ Environment Variables ใน Vercel

## เพิ่มอะไรแล้ว

- เมนู `การตลาด > Google Analytics & Ads`
- รองรับ Google tag (`GT-...` / destination ID)
- รองรับ GA4 Measurement ID (`G-...`)
- รองรับ Google Ads ID (`AW-...`)
- Google Ads website remarketing foundation
- GA4 events: `page_view`, `view_item`, `generate_lead`
- Custom event: `line_click`, `package_view`
- Google Ads conversion hook สำหรับ LINE Click และ Lead Form
- เก็บ GCLID / GBRAID / WBRAID / DCLID + UTM ลง `website_events.metadata`
- Dashboard แสดงจำนวน visitor ที่ตรวจพบว่าเข้าจาก Google Ads / paid Google attribution
- Funnel / Audience เปลี่ยนข้อความให้รองรับทั้ง Meta และ Google Ads

## Environment Variables — ใส่ภายหลังได้

ค่าหลัก:

```text
NEXT_PUBLIC_GOOGLE_TAG_ID
NEXT_PUBLIC_GA4_MEASUREMENT_ID
NEXT_PUBLIC_GOOGLE_ADS_ID
```

Conversion Labels (Optional):

```text
NEXT_PUBLIC_GOOGLE_ADS_LINE_CONVERSION_LABEL
NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL
```

ตัวอย่างโครงค่า:

```text
NEXT_PUBLIC_GOOGLE_TAG_ID=GT-XXXXXXXXXX
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_LINE_CONVERSION_LABEL=AbCdEf123
NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL=GhIjKl456
```

ถ้า Conversion Label ที่คัดลอกจาก Google มาเป็นรูป `AW-XXXXXXXXXX/AbCdEf123` สามารถใส่แบบเต็มได้ ระบบรองรับเช่นกัน

## Event Mapping

| Bhutan Center | Google |
|---|---|
| page_view | page_view + remarketing page signal |
| package_view | view_item + package_view |
| line_click | line_click + Google Ads conversion เมื่อมี label |
| lead_submit | generate_lead + Google Ads conversion เมื่อมี label |
| quotation_sent | Reserved: Offline Conversion phase |
| payment_received | Reserved: Purchase / Offline Conversion phase |

## Google Ads Attribution

ตัว Tracker จะเก็บค่าเหล่านี้ไว้กับ Website Events อัตโนมัติเมื่อมี:

- `gclid`
- `gbraid`
- `wbraid`
- `dclid`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

จึงสามารถเชื่อม visitor journey กับ LINE / Customer Tracking ใน phase ถัดไปได้ โดยไม่ต้องเปลี่ยน schema ในรอบนี้

## SQL

V13.6 **ไม่ต้องรัน SQL ใหม่** ใช้ `website_events.metadata` ที่มีอยู่แล้ว

## หมายเหตุเรื่อง Google Tag

ถ้าใช้ Google Ads + Google Analytics อยู่แล้ว แนะนำให้ใช้ Google tag เป็นฐานเดียวและเชื่อม destinations ใน Google เพื่อลด tag ซ้ำกัน ถ้ายังไม่พร้อมเชื่อม ให้ปล่อย Environment Variables ว่างไว้ เว็บไซต์จะไม่โหลด Google tag

ก่อนเปิด advertising/analytics tags จริง ควรตรวจ Privacy/Cookie/Consent configuration ให้เหมาะกับผู้ใช้และพื้นที่ที่ให้บริการ
