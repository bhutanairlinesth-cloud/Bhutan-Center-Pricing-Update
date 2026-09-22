# Bhutan Center V13.18.2 — Home Hero Image Fix

## สาเหตุของปัญหา
Hotfix V13.18.1 แก้ `siteImages.tigerNest` เป็นภาพความละเอียดสูงแล้ว แต่ component หน้าแรก `HomeHeroGallery.tsx` ยังอ้างไฟล์เก่า `/images/tiger-nest-paro-real.png` ซึ่งมีขนาดเพียง 512×512 px โดยตรง จึงยังแตกเมื่อแสดงเต็ม Hero บน Desktop

## สิ่งที่แก้
- `HomeHeroGallery.tsx` ใช้ `siteImages` กลางสำหรับทั้ง 4 เมืองแล้ว
- Paro / Thimphu / Punakha / Gangtey ใช้ภาพระดับ 1920px
- เพิ่ม loading hint ให้ภาพ Hero โหลดเป็น priority
- รวม `site-images.ts` และ `globals.css` จาก V13.18.1 เพื่อให้ชุดนี้เป็น cumulative hotfix

## ไฟล์ที่ต้องอัป
- `components/HomeHeroGallery.tsx`
- `lib/site-images.ts`
- `app/globals.css`

ไม่ต้องรัน SQL
