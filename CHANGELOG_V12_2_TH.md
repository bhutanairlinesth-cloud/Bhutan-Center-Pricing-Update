# Changelog v12.2

- เพิ่มการรับ LAND Invoice เป็น USD
- เพิ่มเลข Invoice และวันที่ได้รับ Invoice จาก LAND
- เพิ่มอัตราแลกเปลี่ยน ณ วันที่โอนจริง
- เพิ่มค่าธรรมเนียมโอนแบบไม่บังคับ
- แปลง USD เป็น THB อัตโนมัติ
- ย้าย LAND Payment ออกจากช่วงเสนอราคา ไปอยู่หลังรับชำระ Invoice 2
- กำไรจะแสดงเป็นกำไรจริงหลังมี LAND Payment เท่านั้น
- เพิ่มสถานะ “ได้รับ Land Invoice”, “รอโอน LAND” และ “โอน LAND แล้ว”
- บังคับให้บันทึกยอด Land Invoice USD ก่อนออก Invoice 2
- ปรับ Next Action ตาม Workflow ใหม่
