import React, { createContext, useContext, useMemo, useState } from 'react';
import { Language } from './types';

const copy = {
  th: {
    appName: 'Bhutan Center Pricing', tagline: 'ระบบคำนวณและบริหารราคาทัวร์ภูฏาน',
    signIn: 'เข้าสู่ระบบ', welcome: 'ยินดีต้อนรับ', loginHint: 'เข้าสู่พื้นที่ทำงานของทีม OMG Experience',
    email: 'อีเมล', password: 'รหัสผ่าน', enterEmail: 'name@company.com', enterPassword: 'กรอกรหัสผ่าน',
    signingIn: 'กำลังเข้าสู่ระบบ...', secureCloud: 'เชื่อมต่อฐานข้อมูลอย่างปลอดภัย',
    frontOffice: 'หน้าคำนวณราคา', backOffice: 'จัดการหลังบ้าน', logout: 'ออกจากระบบ',
    calculatorTitle: 'คำนวณราคาทัวร์', calculatorSubtitle: 'เลือกข้อมูลเพียงไม่กี่ขั้นตอน ระบบจะแสดงราคา Retail หรือ Agent ทันที',
    channel: 'ช่องทางราคา', retail: 'ลูกค้าทั่วไป', agent: 'Agent / Partner', retailHint: 'ราคาสำหรับขายตรงให้ลูกค้า', agentHint: 'ราคาสำหรับคู่ค้าและเอเจนต์',
    tripDetails: 'รายละเอียดการเดินทาง', package: 'โปรแกรมทัวร์', passengers: 'จำนวนผู้เดินทาง', hotelLevel: 'ระดับโรงแรม', hotel: 'โรงแรม', travelDate: 'วันเดินทาง',
    businessUpgrade: 'อัปเกรดชั้นธุรกิจ', businessUpgradeHint: 'ส่วนเพิ่มราคาขายจะรวมในแพ็กเกจ และไม่บวกใน Invoice 1', singleRoom: 'พักเดี่ยว', singleRoomHint: 'เลือกจำนวนผู้เดินทางที่ต้องการห้องพักเดี่ยว', singleRoomCount: 'จำนวนผู้พักเดี่ยว', singleSupplement: 'ส่วนต่างพักเดี่ยว / ท่าน', packageDefault: 'ราคาตั้งต้นของแพ็กเกจ', resetDefault: 'ใช้ราคาตั้งต้น', people: 'ท่าน', nights: 'คืน',
    liveSummary: 'สรุปราคาแบบเรียลไทม์', perPerson: 'ราคาต่อท่าน', groupTotal: 'ยอดรวมทั้งกรุ๊ป', cost: 'ต้นทุน', profit: 'กำไร', margin: 'Margin',
    flight: 'ตั๋วเครื่องบิน', airportTax: 'ภาษีสนามบิน', ground: 'แพ็กเกจและโรงแรม', visa: 'วีซ่า',
    createQuote: 'จัดทำใบเสนอราคา', printPdf: 'พิมพ์ / บันทึก PDF', editInput: 'แก้ไขข้อมูล',
    customerInfo: 'ข้อมูลผู้รับใบเสนอราคา', customerName: 'ชื่อลูกค้า / บริษัท', phone: 'เบอร์โทรศัพท์', note: 'หมายเหตุเพิ่มเติม', continue: 'ดำเนินการต่อ', cancel: 'ยกเลิก',
    quotation: 'ใบเสนอราคา', quoteNo: 'เลขที่ใบเสนอราคา', issueDate: 'วันที่ออกเอกสาร', preparedFor: 'เสนอแก่', preparedBy: 'จัดทำโดย',
    pricingDetails: 'รายละเอียดราคา', totalDue: 'ยอดเสนอราคาสุทธิ', terms: 'เงื่อนไขสำคัญ',
    term1: 'ราคาขึ้นอยู่กับที่นั่งเที่ยวบินและห้องพัก ณ วันที่ยืนยันการจอง',
    term2: 'การจองสมบูรณ์เมื่อบริษัทได้รับเงินมัดจำและออกเอกสารยืนยัน',
    term3: 'กรุณาส่งเอกสารหนังสือเดินทางสำหรับยื่นวีซ่าล่วงหน้า',
    adminOverview: 'ภาพรวมหลังบ้าน', packages: 'โปรแกรมทัวร์', hotels: 'โรงแรม', pricingSettings: 'ตั้งค่าราคา', users: 'ผู้ใช้งาน',
    adminSubtitle: 'แก้ไขข้อมูลกลางที่ใช้คำนวณราคาหน้าบ้าน', syncNow: 'รีเฟรชข้อมูล', backToCalculator: 'กลับหน้าคำนวณ',
    totalPackages: 'โปรแกรมทั้งหมด', totalHotels: 'โรงแรมทั้งหมด', currentUsd: 'อัตรา USD ปัจจุบัน', systemUsers: 'ผู้ใช้งานระบบ',
    quickEdit: 'จัดการข้อมูล', addPackage: 'เพิ่มโปรแกรม', addHotel: 'เพิ่มโรงแรม', edit: 'แก้ไข', delete: 'ลบ', save: 'บันทึก', add: 'เพิ่มรายการ',
    packageName: 'ชื่อโปรแกรม', durationNights: 'จำนวนคืน', category: 'ประเภท', rate1: 'ราคา 1 ท่าน', rate2: 'ราคา 2 ท่าน', rate3: 'ราคา 3 ท่านขึ้นไป',
    flightPricing: 'ราคาตั๋วและภาษี', retailFlight: 'ราคาตั๋วลูกค้าทั่วไป', agentFlight: 'ราคาตั๋ว Agent', agentDiscount: 'ส่วนลด Agent',
    exchangeVisa: 'อัตราแลกเปลี่ยนและวีซ่า', usdRate: 'อัตรา USD → THB', visaFee: 'ค่าวีซ่า USD',
    margins: 'กำไรต่อท่าน', retailMargin: 'Margin ลูกค้าทั่วไป', agentMargin: 'Margin Agent', airportTaxLabel: 'ภาษีสนามบินต่อท่าน',
    legacyHotelDefaults: 'ราคาโรงแรมมาตรฐานเดิม', saveSettings: 'บันทึกการตั้งค่าทั้งหมด',
    role: 'สิทธิ์', admin: 'ผู้ดูแลระบบ', sales: 'ฝ่ายขาย', userNote: 'การสร้างบัญชี Login ใหม่ต้องทำใน Supabase Authentication ก่อน จากนั้น Profile จะปรากฏในหน้านี้',
    online: 'Supabase Online', local: 'Local Mode', loading: 'กำลังเตรียมระบบ...', noData: 'ยังไม่มีข้อมูล', confirmDelete: 'ยืนยันการลบรายการนี้หรือไม่?',
    saved: 'บันทึกข้อมูลเรียบร้อยแล้ว', deleted: 'ลบข้อมูลเรียบร้อยแล้ว', error: 'เกิดข้อผิดพลาด', refreshDone: 'รีเฟรชข้อมูลแล้ว',
    groupDiscount: 'ส่วนลดกลุ่ม', groupDiscountSettings: 'ส่วนลดเมื่อเดินทางเป็นกลุ่ม', groupDiscountMinPax: 'เริ่มใช้ส่วนลดตั้งแต่', groupDiscountPercent: 'เปอร์เซ็นต์ส่วนลด', groupDiscountHint: 'ลดจากราคาตั๋วเครื่องบินต่อท่าน เมื่อจำนวนผู้เดินทางถึงเกณฑ์ที่กำหนด', quoteLanguage: 'ภาษาเอกสาร',
  },
  en: {
    appName: 'Bhutan Center Pricing', tagline: 'Bhutan tour pricing and management workspace',
    signIn: 'Sign in', welcome: 'Welcome back', loginHint: 'Enter the OMG Experience team workspace',
    email: 'Email', password: 'Password', enterEmail: 'name@company.com', enterPassword: 'Enter password',
    signingIn: 'Signing in...', secureCloud: 'Secure cloud database connection',
    frontOffice: 'Price Calculator', backOffice: 'Back Office', logout: 'Sign out',
    calculatorTitle: 'Calculate tour price', calculatorSubtitle: 'Choose a few trip details and get Retail or Agent pricing instantly.',
    channel: 'Pricing channel', retail: 'Retail customer', agent: 'Agent / Partner', retailHint: 'Direct selling price for customers', agentHint: 'Wholesale price for partners and agents',
    tripDetails: 'Trip details', package: 'Tour package', passengers: 'Passengers', hotelLevel: 'Hotel category', hotel: 'Hotel', travelDate: 'Travel date',
    businessUpgrade: 'Business class upgrade', businessUpgradeHint: 'The selling surcharge is included in the package and excluded from Invoice 1', singleRoom: 'Single room', singleRoomHint: 'Choose how many travellers require private single rooms', singleRoomCount: 'Single-room travellers', singleSupplement: 'Single supplement / pax', packageDefault: 'Package default', resetDefault: 'Use package default', people: 'pax', nights: 'nights',
    liveSummary: 'Live price summary', perPerson: 'Price per person', groupTotal: 'Group total', cost: 'Cost', profit: 'Profit', margin: 'Margin',
    flight: 'Air ticket', airportTax: 'Airport tax', ground: 'Package & hotel', visa: 'Visa',
    createQuote: 'Create quotation', printPdf: 'Print / Save PDF', editInput: 'Edit details',
    customerInfo: 'Quotation recipient', customerName: 'Customer / company name', phone: 'Phone', note: 'Additional note', continue: 'Continue', cancel: 'Cancel',
    quotation: 'Quotation', quoteNo: 'Quotation no.', issueDate: 'Issue date', preparedFor: 'Prepared for', preparedBy: 'Prepared by',
    pricingDetails: 'Pricing details', totalDue: 'Grand total', terms: 'Important terms',
    term1: 'Prices are subject to flight-seat and room availability at confirmation.',
    term2: 'Booking is confirmed after deposit payment and issuance of confirmation.',
    term3: 'Please submit passport documents in advance for visa processing.',
    adminOverview: 'Back-office overview', packages: 'Tour packages', hotels: 'Hotels', pricingSettings: 'Pricing settings', users: 'Users',
    adminSubtitle: 'Manage the central data used by the front-office calculator.', syncNow: 'Refresh data', backToCalculator: 'Back to calculator',
    totalPackages: 'Total packages', totalHotels: 'Total hotels', currentUsd: 'Current USD rate', systemUsers: 'System users',
    quickEdit: 'Data management', addPackage: 'Add package', addHotel: 'Add hotel', edit: 'Edit', delete: 'Delete', save: 'Save', add: 'Add item',
    packageName: 'Package name', durationNights: 'Number of nights', category: 'Category', rate1: '1 pax rate', rate2: '2 pax rate', rate3: '3+ pax rate',
    flightPricing: 'Flight pricing & tax', retailFlight: 'Retail air ticket', agentFlight: 'Agent air ticket', agentDiscount: 'Agent discount',
    exchangeVisa: 'Exchange rate & visa', usdRate: 'USD → THB rate', visaFee: 'Visa fee USD',
    margins: 'Margin per person', retailMargin: 'Retail margin', agentMargin: 'Agent margin', airportTaxLabel: 'Airport tax per person',
    legacyHotelDefaults: 'Legacy default hotel rates', saveSettings: 'Save all settings',
    role: 'Role', admin: 'Administrator', sales: 'Sales', userNote: 'Create a new login in Supabase Authentication first. Its profile will then appear here.',
    online: 'Supabase Online', local: 'Local Mode', loading: 'Preparing workspace...', noData: 'No data yet', confirmDelete: 'Delete this item?',
    saved: 'Changes saved', deleted: 'Item deleted', error: 'Something went wrong', refreshDone: 'Data refreshed',
    groupDiscount: 'Group discount', groupDiscountSettings: 'Group travel discount', groupDiscountMinPax: 'Apply from', groupDiscountPercent: 'Discount percentage', groupDiscountHint: 'Discount the air ticket per person when the passenger count reaches the configured threshold.', quoteLanguage: 'Document language',
  },
} as const;

type TranslationKey = keyof typeof copy.th;
interface I18nValue { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string; }
const I18nContext = createContext<I18nValue>({ language: 'th', setLanguage: () => undefined, t: (key) => copy.th[key] });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('bhutan-language') as Language) || 'th');
  const setLanguage = (next: Language) => { localStorage.setItem('bhutan-language', next); document.documentElement.lang = next; setLanguageState(next); };
  const value = useMemo<I18nValue>(() => ({ language, setLanguage, t: (key) => copy[language][key] }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();
  return <div className={`language-toggle ${compact ? 'compact' : ''}`}>
    <button type="button" className={language === 'th' ? 'active' : ''} onClick={() => setLanguage('th')}>ไทย</button>
    <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
  </div>;
}
