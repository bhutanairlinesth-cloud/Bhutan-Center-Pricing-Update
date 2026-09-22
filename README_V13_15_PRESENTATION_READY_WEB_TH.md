# Bhutan Center V13.15.0 — Presentation Ready Website

เป้าหมายรอบนี้: ปรับ Public Website ให้พร้อมเดโมผู้บริหาร โดยเน้น “เข้าใจเร็ว → เชื่อถือ → เห็นราคา/แพ็กเกจ → ติดต่อได้ทันที” และไม่แตะ logic Invoice/Admin รอบก่อนหน้า

## สิ่งที่แก้

- หน้าแรกปรับใหม่ให้เป็น Conversion-first: ราคาเริ่มต้น, ปุ่มดูแพ็กเกจ, LINE, จุดแข็ง, เส้นทาง และขั้นตอนขอราคาเห็นตั้งแต่ช่วงแรก
- เปลี่ยนภาพสถานที่หลักเป็นภาพสถานที่จริงที่ตรวจชื่อสถานที่จาก Wikimedia Commons: Tiger’s Nest, Punakha Dzong, Tashichho Dzong, Phobjikha Valley และ Bhutan Airlines ที่ Paro Airport
- เพิ่ม Photo credits แบบพับเก็บใน Footer ตามเงื่อนไข Creative Commons
- เมือง Paro / Thimphu / Punakha / Gangtey บน Hero เปลี่ยนจากข้อความที่ดูเหมือนปุ่มแต่กดไม่ได้ เป็นลิงก์จริง
- เพิ่ม pointer/focus state และกัน decorative overlay ไม่ให้บังการคลิก
- เมนูหลักมี active state เพื่อให้เดโมแล้วรู้ว่ากำลังอยู่หน้าไหน
- หน้า Packages และ Package Detail ปรับ CTA ให้ชัด: ดูราคา / LINE / ขอใบเสนอราคา
- หน้า Destinations ใช้ภาพจริง + deep link ไปยังเมืองที่เลือกจากหน้าแรก
- หน้า Bhutan Airlines ใช้ภาพเครื่องจริงที่ Paro และนำเสนอ GSA Thailand ให้ชัด
- หน้า Visa, Journal, Partner ตัดข้อความเชิงระบบ/ข้อความ migration ที่ไม่ควรให้ลูกค้าเห็น
- หน้า Hotels เปลี่ยนจากรายชื่อโรงแรมที่อาจทำให้เข้าใจว่า “การันตีโรงแรมนี้” เป็นการเลือกมาตรฐาน 3★ / 4★ / 5★ และแจ้งว่าจะยืนยันชื่อโรงแรมตามห้องว่างจริง
- หน้า Travel Info ปรับข้อมูลการชำระเงิน/Passport ให้อ่านง่ายและไม่ชวนเข้าใจผิด
- หน้า Contact ให้ LINE เป็นทางหลัก และมีปุ่มขอใบเสนอราคาชัดเจน

## ข้อเท็จจริงที่ใช้ตรวจสอบ

- OMG Experience Co., Ltd. ถูกระบุเป็น GSA - Thailand ในหน้า Our Partners ของ Bhutan Airlines
- Bhutan Travel ระบุว่า tour operator สามารถดำเนินการยื่น Visa ในนามผู้เดินทางได้ และ Passport สำหรับผู้เดินทางต่างชาติควรมีอายุอย่างน้อย 6 เดือน
- ข้อมูลราคา Public Package ยังคงอ่านจาก Supabase ผ่าน `getPublicPackages()` เหมือนเดิม ไม่ hard-code ทับราคาหลังบ้าน

## ไฟล์ที่แก้รอบนี้

1. package.json
2. app/globals.css
3. app/page.tsx
4. app/destinations/page.tsx
5. app/bhutan-airlines/page.tsx
6. app/visa/page.tsx
7. app/journal/page.tsx
8. app/partner/page.tsx
9. app/packages/page.tsx
10. app/package/page.tsx
11. app/about-bhutan/page.tsx
12. app/hotels/page.tsx
13. app/contact/page.tsx
14. app/travel-info/page.tsx
15. components/Header.tsx
16. components/Footer.tsx
17. lib/packages.ts
18. lib/site-images.ts
19. README_V13_15_PRESENTATION_READY_WEB_TH.md

## Deploy

อัปไฟล์ทั้งหมดตามโครงสร้างเดิม → Commit → ให้ Vercel Deploy Production

รอบนี้ **ไม่ต้องรัน SQL เพิ่ม** เพราะแก้เฉพาะ Public Website/UI

## เช็กก่อนพรีเซ็น

1. หน้า `/` เห็น Hero ภาพ Punakha จริง + ราคาเริ่มต้น + 2 CTA
2. กด Paro / Thimphu / Punakha / Gangtey บนภาพ Hero แล้วกระโดดไป section ที่ถูกต้อง
3. กดแพ็กเกจจากหน้าแรก → เปิดรายละเอียด → LINE และ “ขอใบเสนอราคา” ทำงาน
4. เปิด `/bhutan-airlines` → ปุ่ม “ขอราคาเที่ยวบิน” เลื่อนลงแบบฟอร์มได้
5. เปิด `/hotels`, `/visa`, `/travel-info`, `/contact` ตรวจ copy และ CTA
6. ทดสอบ LINE และแบบฟอร์ม Lead อย่างน้อย 1 ครั้งก่อนประชุม
7. ทดสอบ Desktop + Mobile และ Hard Refresh หลัง Deploy

## QA ที่ทำในชุดไฟล์นี้

- ตรวจ TSX syntax ของหน้าที่แก้: ไม่พบ syntax error
- ตรวจ CSS braces: ครบคู่
- ตรวจ public source: ไม่พบข้อความ migration / debug / หลังบ้านหลุดในหน้า Public
- ตรวจ action ที่ดูเหมือนปุ่ม: เมืองบน Hero เปลี่ยนเป็น Link จริง และ overlay decoration ตั้ง `pointer-events:none`

หมายเหตุ: สภาพแวดล้อมทำแพตช์ไม่มี `node_modules` จึงไม่ได้รัน `next build` เต็มในเครื่องนี้; Vercel จะเป็น production build verification ขั้นสุดท้าย
