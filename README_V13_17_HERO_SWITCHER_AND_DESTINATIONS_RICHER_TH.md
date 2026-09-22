# Bhutan Center V13.17 — Hero Switcher + Richer Destinations

อัปเดตชุดนี้แก้ 3 เรื่องหลัก

1. หน้าแรกส่วน Hero ปรับจากปุ่มลิงก์ให้เป็นปุ่ม **สลับภาพ** ของ Paro / Thimphu / Punakha / Gangtey โดยไม่พาออกจากหน้า
2. ปรับโทนภาพ Hero ให้สดและน่าเที่ยวขึ้น พร้อมแก้ระยะบรรทัดหัวข้อใหญ่ให้หายชิด
3. ทำหน้า `destinations` ให้ดูเต็มและน่าสนใจขึ้น โดยเพิ่มการ์ดภาพรวม 4 พื้นที่ และรายละเอียดว่าแต่ละเมืองเหมาะกับใคร

## ไฟล์ที่แก้
- `app/page.tsx`
- `app/destinations/page.tsx`
- `app/globals.css`
- `components/HomeHeroGallery.tsx`
- `lib/site-images.ts`
- `public/images/tiger-nest-paro-real.png`

## หมายเหตุ
- ไม่ต้องรัน SQL
- ใช้สำหรับอัปทับตัวเว็บ public ได้เลย
