# Bhutan Center Unified V13.9 — Meta Pixel + Conversions API (CAPI)

V13.9 ทำให้หน้า **การตลาด → Facebook Pixel** เชื่อม Meta ได้ครบจากหลังบ้าน:

- Facebook Pixel ID
- Conversions API Access Token (เก็บแบบเข้ารหัสฝั่ง Server)
- Test Event Code
- ปุ่ม **ส่ง Test Event**
- แสดงผล Test ล่าสุด / events_received / fbtrace_id
- Browser Pixel + Server CAPI ทำงานคู่กัน
- Event ID เดียวกันสำหรับ Deduplication

## Event ที่ Live แล้ว

| Bhutan Center | Meta |
|---|---|
| page_view | PageView |
| package_view | ViewContent |
| line_click | LineAddFriendClick (Custom) |
| lead_submit | Lead |

Production CAPI **ไม่ส่ง `test_event_code`** แม้เก็บ Test Code ไว้ในหลังบ้าน Test Code จะถูกใช้เฉพาะเมื่อกดปุ่ม `ส่ง Test Event` เท่านั้น

## ก่อนใช้งาน

1. Upload Patch V13.9 เข้า GitHub repo เดิม
2. รอ Vercel Deploy ผ่าน
3. Run `supabase/UNIFIED_V13_9_META_CAPI.sql` หนึ่งครั้ง
4. เข้า Admin → การตลาด → Facebook Pixel
5. Pixel ID ใช้ของ Bhutan Center: `1574103264254056`
6. Meta Events Manager → Dataset/Pixel → Settings → Conversions API → Generate access token
7. Meta Events Manager → Test Events → Copy Test Event Code
8. กลับมาหลังบ้าน วาง Access Token + Test Event Code → เปิดสวิตช์ → กด `ส่ง Test Event`
9. ถ้าสำเร็จ หลังบ้านจะแสดง “Meta รับ Test Event แล้ว” และ Events Manager จะเห็น Server PageView

## ความปลอดภัย

Access Token ไม่ถูกเก็บใน `marketing_runtime_settings` และไม่ถูกส่งกลับไปยัง Browser หลัง Save
ระบบเข้ารหัส Token ด้วย AES-256-GCM และเก็บใน `marketing_secret_settings`
คีย์เข้ารหัสใช้ `MARKETING_SECRETS_KEY` ถ้ามี หรือ fallback ไปยัง `SUPABASE_SERVICE_ROLE_KEY` ซึ่งระบบ Admin เดิมต้องมีอยู่แล้ว

หากมีการ Rotate `SUPABASE_SERVICE_ROLE_KEY` และไม่ได้ตั้ง `MARKETING_SECRETS_KEY` ให้เข้าหลังบ้านแล้ววาง CAPI Token ใหม่อีกครั้ง

## Optional Environment

- `MARKETING_SECRETS_KEY` — dedicated encryption secret (แนะนำในระยะยาว แต่ไม่บังคับ)
- `META_GRAPH_API_VERSION` — default `v24.0`

