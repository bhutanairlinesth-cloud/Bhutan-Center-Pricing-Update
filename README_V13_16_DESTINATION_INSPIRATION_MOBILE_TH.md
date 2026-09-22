# Bhutan Center V13.16 — Destination Inspiration + Mobile Conversion

ชุดนี้รวมการแก้ V13.15.1 (ภาพ Tiger's Nest / Hero ไม่ซ้อน / LINE panel) และเพิ่มส่วนที่ได้แนวทางจากเว็บไซต์การท่องเที่ยวภูฏานอย่างเป็นทางการ โดยเขียนเนื้อหาใหม่สำหรับ Bhutan Center ไม่ได้คัดข้อความตรงจากต้นทาง

## เพิ่มในหน้า Home

1. WHY BHUTAN
- สื่อเหตุผลว่าเหตุใดภูฏานน่าไปก่อนเริ่มขายแพ็กเกจ
- 70%+ ป่า
- เที่ยวได้ 4 ฤดู
- เทศกาลมากกว่า 160 งานต่อปี
- แนวคิดท่องเที่ยวที่เน้นธรรมชาติ วัฒนธรรม และชุมชน

2. SIGNATURE EXPERIENCES
- Tiger's Nest
- Tshechu Festival / Masked Dance
- Traditional Hot Stone Bath
- Traditional Archery

3. BEST TIME TO VISIT
- Spring มี.ค.–พ.ค.
- Summer มิ.ย.–ส.ค.
- Autumn ก.ย.–พ.ย.
- Winter ธ.ค.–ก.พ.
- ทำเป็นการ์ดเลื่อนแนวนอนบนมือถือ

4. FESTIVAL JOURNEYS
- เล่าเทศกาลเป็นเหตุผลในการเลือกวันเดินทาง
- Paro Tshechu / Thimphu Tshechu / Black-necked Crane Festival
- ไม่ hard-code วัน เพื่อไม่ให้หน้าเว็บล้าสมัยเมื่อปีเปลี่ยน

5. FIRST TIME IN BHUTAN
- Visa US$40
- ระยะพิจารณาคำขอที่กรอกครบถ้วนได้ถึง 5 วันทำการ
- SDF US$100 ต่อผู้ใหญ่ต่อวัน ตามข้อมูลทางการปัจจุบัน
- เชื่อมกลับว่าทีม Bhutan Center ดูแลงานหลักในแพ็กเกจเดียว

## Responsive / Mobile

- Experience cards และ Season cards ใช้ horizontal snap-scroll บนมือถือ เพื่อไม่บีบการ์ดให้แคบ
- Why Bhutan / Festival / First Timer เปลี่ยนเป็น 1 column บนจอเล็ก
- Planner form เปลี่ยนเป็น 1 column บนมือถือ
- ปุ่ม LINE กว้างเต็มจอและแตะง่าย
- input โทรศัพท์ใช้ mobile telephone keyboard
- input จำนวนคนใช้ numeric keyboard
- ลด padding / font / card radius สำหรับหน้าจอเล็ก
- Hero ไม่มีภาพ inset ซ้อนบนภาพหลักแล้ว

## รูปภาพ

ใช้ภาพสถานที่และวัฒนธรรมจริงจาก Wikimedia Commons พร้อม Photo credits ใน Footer:
- Paro Taktsang
- Punakha Dzong
- Tashichho Dzong
- Phobjikha Valley
- Bhutan Airlines at Paro
- Hot Stone Bath, Bumthang
- Traditional Archery
- Masked Buddhist Dance

## อ้างอิงข้อมูล

ข้อมูลข้อเท็จจริงถูกเรียบเรียงจาก Bhutan Travel (Department of Tourism Bhutan) ได้แก่ FAQ, Visa, About, Wellness, all-year-round destination และ Festival 2026 information

## การ Deploy

อัปไฟล์ใน ZIP ไปทับตำแหน่งเดิมใน GitHub แล้วรอ Vercel Deploy ใหม่
ไม่ต้องรัน SQL เพิ่ม เพราะชุดนี้แก้เฉพาะ Public Website / UX / Responsive
