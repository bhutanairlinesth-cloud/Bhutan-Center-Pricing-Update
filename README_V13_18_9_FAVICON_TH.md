# V13.18.9 — Bhutan Center Favicon / Browser Tab Logo

เพิ่มโลโก้ Bhutan Center ให้แสดงบนแท็บ Browser ทั้ง:
- เว็บไซต์ Public
- ระบบหลังบ้าน `/admin`

## สิ่งที่แก้
- สร้าง favicon จากสัญลักษณ์นกของโลโก้ Bhutan Center เดิม
- เพิ่ม `/favicon.ico` สำหรับ Browser ทั่วไป
- เพิ่ม PNG 32px และ 192px
- ระบุ favicon ใน Next.js metadata
- เพิ่ม favicon links ใน `admin-app/index.html`

## ไฟล์
- app/layout.tsx
- admin-app/index.html
- public/favicon.ico
- public/favicon.png
- public/favicon-32.png
- public/favicon-192.png

ไม่ต้องรัน SQL

หลัง Deploy ถ้ายังเห็นไอคอนเดิม ให้ Hard Refresh หรือปิดแท็บแล้วเปิดใหม่ เพราะ Browser cache favicon ค่อนข้างแรง
