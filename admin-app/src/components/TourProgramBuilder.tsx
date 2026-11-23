import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, MapPinned, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { CustomerTracking, HotelCategory, TourProgram, TourProgramDay, User } from '../types';
import { diffTourDays, generateTourProgramDays, programNameFor, STANDARD_CITIES } from '../lib/tourProgramRules';

type Props = {
  currentUser: User;
  trackings: CustomerTracking[];
  programs: TourProgram[];
  onSave: (program: TourProgram) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const CITY_OPTIONS = ['Paro', 'Thimphu', 'Punakha', 'Haa', 'Gangtey'];
function createProgram(currentUser: User): TourProgram {
  const start = isoDate(new Date());
  const end = addDays(start, 4);
  const seed: TourProgram = {
    id: uid('tp'),
    trackingId: '',
    customerName: '',
    title: 'WONDERS OF BHUTAN',
    status: 'draft',
    startDate: start,
    endDate: end,
    cities: ['Paro', 'Thimphu', 'Punakha'],
    hotelCategory: '3 Stars',
    outboundFlight: { flightNo: '', departureAirport: 'BKK', arrivalAirport: 'PBH', departureTime: '', arrivalTime: '' },
    inboundFlight: { flightNo: '', departureAirport: 'PBH', arrivalAirport: 'BKK', departureTime: '', arrivalTime: '' },
    options: { includeFestival: false, festivalName: '', festivalDate: '' },
    selectedFestivalIds: [],
    days: [],
    guideName: '',
    guideContact: '',
    roomType: 'Twin / Double',
    note: '',
    createdById: currentUser.id,
    createdByName: currentUser.name,
    finalizedAt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  seed.days = generateTourProgramDays(seed);
  return seed;
}


const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatTravelDate = (value: string) => {
  if (!value) return '-';
  const d = new Date(value + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const ACTIVITY_COPY: Record<string, string> = {
  'Rinpung Dzong': 'เยี่ยมชมพาโรรินปุงซอง ป้อมปราการสำคัญของเมืองพาโร และชมสถาปัตยกรรมซองอันเป็นเอกลักษณ์ของภูฏาน',
  'National Museum of Bhutan': 'ชมพิพิธภัณฑสถานแห่งชาติภูฏาน เรียนรู้ประวัติศาสตร์ ศิลปวัฒนธรรม และวิถีชีวิตของชาวภูฏาน',
  'Kyichu Lhakhang': 'สักการะวัดคิชูลาคัง หนึ่งในวัดเก่าแก่และศักดิ์สิทธิ์ที่สุดของภูฏาน',
  'Buddha Dordenma': 'สักการะองค์พระใหญ่ Buddha Dordenma พร้อมชมทัศนียภาพเมืองทิมพูจากมุมสูง',
  'Takin Zoo': 'ชมทาคิน สัตว์ประจำชาติของภูฏาน ณ เขตอนุรักษ์ทาคินเมืองทิมพู',
  'National Library': 'เยี่ยมชมหอสมุดแห่งชาติ แหล่งรวบรวมคัมภีร์และเอกสารสำคัญของภูฏาน',
  'National Post Office': 'เยี่ยมชมที่ทำการไปรษณีย์แห่งชาติ ซึ่งมีชื่อเสียงด้านตราไปรษณียากรของภูฏาน',
  'Memorial Chorten': 'เยี่ยมชม National Memorial Chorten อนุสรณ์สถานสำคัญใจกลางเมืองทิมพู',
  'Tashichho Dzong': 'ชมตาชิโชซอง ศูนย์กลางการบริหารราชการและศาสนาที่สำคัญของเมืองทิมพู',
  'Simtokha Dzong': 'แวะชมซิมโตกาซอง หนึ่งในซองเก่าแก่บนเส้นทางจากทิมพู',
  'Dochula Pass': 'เดินทางผ่านโดชูลาพาส ชมสถูปแห่งชัยชนะ 108 องค์ และทิวทัศน์เทือกเขาหิมาลัยเมื่อท้องฟ้าเปิด',
  'Chimi Lhakhang': 'เยี่ยมชมวัดชิมิลาคัง วัดสำคัญกลางหุบเขาพูนาคา',
  'Punakha Dzong': 'ชมพูนาคาซอง ป้อมปราการที่ตั้งอยู่บริเวณจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu',
  'Punakha Suspension Bridge': 'เดินชมสะพานแขวนพูนาคา สัมผัสบรรยากาศของหุบเขาและสายน้ำ',
  'Sangaygang View Point': 'ชมวิวเมืองทิมพูจากจุดชมวิวซังเกกัง',
  'Chuzom Bridge': 'แวะบริเวณชูซอม จุดบรรจบของเส้นทางสำคัญก่อนเข้าสู่เมืองพาโร',
  'Gangtey Monastery': 'เยี่ยมชมวัดกังเต วัดสำคัญของหุบเขากังเต',
  'Phobjikha Valley': 'ชมธรรมชาติของหุบเขาผอบจิกะ หนึ่งในหุบเขาที่งดงามและสงบของภูฏาน',
  'Taktsang Monastery or Tiger’s Nest': 'เดินขึ้นสู่วัดทักซัง หรือ Tiger’s Nest วัดสำคัญระดับโลกที่ตั้งอยู่บนหน้าผาเหนือหุบเขาพาโร',
  'Lunch at Taktsang Cafeteria': 'รับประทานอาหารกลางวัน ณ Taktsang Cafeteria ระหว่างการเดินขึ้นวัดทักซัง',
  'Paro Street Shopping (City Center)': 'เดินเล่นย่านใจกลางเมืองพาโรและเลือกซื้อของที่ระลึกตามอัธยาศัย',
};

function activityParagraph(item: string) {
  if (ACTIVITY_COPY[item]) return ACTIVITY_COPY[item];
  if (item.startsWith('เทศกาล:')) return 'ร่วมชม' + item.replace('เทศกาล:', '').trim() + ' ตามวันและเวลาจัดงานจริง';
  if (item.includes('สนามบินพาโร')) return 'เดินทางสู่สนามบินนานาชาติพาโร เพื่อเช็กอินและเดินทางกลับกรุงเทพฯ';
  return item;
}

function fullProgramHtml(program: TourProgram) {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const programTitle = programNameFor(total, program.cities);
  const duration = total + ' วัน ' + Math.max(0, total - 1) + ' คืน';
  const route = programTitle === 'THE ULTIMATE BHUTAN'
    ? 'พาโร – ทิมพู – พูนาคา – กังเต – ทักซัง'
    : programTitle === 'Custom to Bhutan'
      ? (program.cities.join(' – ') + ' – พาโร – ทักซัง')
      : 'พาโร – ทิมพู – พูนาคา – ทักซัง';

  const flightOut = (program.outboundFlight.flightNo || '-') + ' ' + (program.outboundFlight.departureTime || '-') + ' – ' + (program.outboundFlight.arrivalTime || '-');
  const flightBack = (program.inboundFlight.flightNo || '-') + ' ' + (program.inboundFlight.departureTime || '-') + ' – ' + (program.inboundFlight.arrivalTime || '-');

  const whyPage = '<section class="page why-page">' +
      '<div class="brand"><strong>BHUTAN CENTER</strong><span>บริการท่องเที่ยวภูฏานที่ใส่ใจทุกความต้องการของคุณ</span></div>' +
      '<div class="why-title"><span>WHY?</span><h2>BHUTAN CENTER</h2></div>' +
      '<div class="why-copy"><p>ภูฏานเซ็นเตอร์มีความชำนาญด้านเส้นทางท่องเที่ยวภูฏาน และออกแบบโปรแกรมให้สอดคล้องกับวันเดินทาง เวลาเที่ยวบิน เมืองที่ลูกค้าต้องการ และช่วงเวลาของเทศกาลสำคัญ โดยสามารถปรับรายละเอียดของแต่ละวันให้เหมาะกับคณะเดินทางได้</p>' +
      '<p>การเดินทางในภูฏานมีข้อจำกัดด้านระยะทางและภูมิประเทศ โปรแกรมจึงจัดลำดับเมืองให้เดินทางต่อเนื่อง และกำหนดให้คืนสุดท้ายก่อนวันเดินทางกลับพักที่เมืองพาโรเสมอ เพื่อให้เหมาะกับการเดินทางสู่สนามบินนานาชาติพาโรในวันถัดไป</p>' +
      '<p>วัดทักซัง หรือ Tiger’s Nest เป็นสถานที่สำคัญของทุกโปรแกรม และถูกจัดไว้ในวันก่อนเดินทางกลับ 1 วัน โดยพักค้างคืนที่พาโรหลังจบกิจกรรม</p></div>' +
      '<footer>52/38 11th Floor, Soi Saladaeng 2, Silom, Bangrak, Bangkok 10500 · info@bhutancenter.com · www.bhutancenter.com · LICENSE NUMBER: 11/07261</footer></section>';

  const dayPages = program.days.map((day) => {
    const rows = day.activities.map((item) => '<p>• ' + escapeHtml(activityParagraph(item)) + '</p>').join('');
    return '<section class="page day-page">' +
      '<div class="brand"><strong>BHUTAN CENTER</strong><span>บริการท่องเที่ยวภูฏานที่ใส่ใจทุกความต้องการของคุณ</span></div>' +
      '<div class="day-head"><div>DAY ' + day.dayNumber + '</div><div><h2>' + escapeHtml(day.title) + '</h2><span>' + escapeHtml(formatTravelDate(day.date)) + '</span></div></div>' +
      '<div class="day-copy">' + rows +
      (day.note ? '<p>• ' + escapeHtml(day.note) + '</p>' : '') +
      (day.meals.breakfast ? '<p>• เช้า รับประทานอาหารเช้า ณ ห้องอาหารของโรงแรม</p>' : '') +
      (day.meals.lunch ? '<p>• เที่ยง รับประทานอาหารกลางวัน ณ ภัตตาคารท้องถิ่น</p>' : '') +
      (day.meals.dinner ? '<p>• ค่ำ รับประทานอาหารค่ำ และพักผ่อนตามอัธยาศัย</p>' : '') +
      '</div>' +
      '<div class="overnight">' + (day.hotel ? '<b>พักค้างคืน:</b> ' + escapeHtml(day.hotel) : '<b>เดินทางกลับกรุงเทพฯ</b>') + '</div>' +
      '<footer>52/38 11th Floor, Soi Saladaeng 2, Silom, Bangrak, Bangkok 10500 · info@bhutancenter.com · LICENSE NUMBER: 11/07261</footer>' +
      '</section>';
  }).join('');

  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(programTitle) + '</title>' +
    '<style>' +
    '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e8e4dd;color:#2b2926;font-family:Tahoma,Arial,sans-serif}' +
    '.toolbar{position:sticky;top:0;z-index:3;display:flex;gap:10px;justify-content:center;padding:12px;background:#173d32}.toolbar button{border:0;border-radius:9px;padding:10px 18px;font-weight:700;cursor:pointer}.toolbar .primary{background:#c99b50;color:white}.toolbar .secondary{background:white;color:#173d32}' +
    '.page{width:210mm;min-height:297mm;margin:14px auto;padding:18mm 17mm 14mm;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.12);position:relative;page-break-after:always}.cover{display:flex;flex-direction:column;text-align:center}.cover .brand{margin-bottom:34mm}.brand{display:flex;flex-direction:column;gap:3px;color:#173d32}.brand strong{font-size:22px;letter-spacing:.05em}.brand span{font-size:12px;color:#6d675f}' +
    '.cover h1{font-size:30px;margin:12px 0 4px;color:#173d32}.cover h2{font-size:24px;margin:0;color:#b2823c}.route{font-size:18px;font-weight:700;margin:16px 0}.summary{margin:24mm auto 0;width:100%;max-width:150mm;text-align:left;border-top:2px solid #173d32;padding-top:14px;display:grid;gap:8px;font-size:14px}.why-title{margin:30mm 0 12mm}.why-title span{display:block;font-size:42px;font-weight:900;color:#c99b50}.why-title h2{margin:0;font-size:30px;color:#173d32}.why-copy{display:grid;gap:15px}.why-copy p{font-size:16px;line-height:1.9;margin:0}' +
    '.day-head{display:grid;grid-template-columns:32mm 1fr;gap:14px;align-items:center;margin:18mm 0 12mm;border-bottom:2px solid #173d32;padding-bottom:10px}.day-head>div:first-child{font-size:26px;font-weight:900;color:#b2823c}.day-head h2{margin:0;color:#173d32;font-size:22px}.day-head span{font-size:12px;color:#7b746c}.day-copy p{font-size:15px;line-height:1.75;margin:0 0 9px}.overnight{margin-top:18px;padding:13px 15px;border-left:4px solid #c99b50;background:#f7f2e9;font-size:14px}' +
    'footer{position:absolute;left:17mm;right:17mm;bottom:9mm;padding-top:7px;border-top:1px solid #d8d1c7;font-size:9px;color:#7c756d;text-align:center}@media print{body{background:white}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}}' +
    '</style></head><body>' +
    '<div class="toolbar"><button class="primary" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><button class="secondary" onclick="window.close()">ปิด</button></div>' +
    '<section class="page cover"><div class="brand"><strong>BHUTAN CENTER</strong><span>บริการท่องเที่ยวภูฏานที่ใส่ใจทุกความต้องการของคุณ</span></div>' +
    '<div><h1>' + escapeHtml(programTitle) + '</h1><h2>' + escapeHtml(duration) + '</h2><div class="route">' + escapeHtml(route) + '</div></div>' +
    '<div class="summary">' +
    '<div><b>Travel itinerary:</b> ' + escapeHtml(program.trackingId || '-') + '</div>' +
    '<div><b>Customer:</b> ' + escapeHtml(program.customerName || '-') + '</div>' +
    '<div><b>Guide Name:</b> ' + escapeHtml(program.guideName || '-') + '</div>' +
    '<div><b>Contact Guide:</b> ' + escapeHtml(program.guideContact || '-') + '</div>' +
    '<div><b>Room Type:</b> ' + escapeHtml(program.roomType || '-') + '</div>' +
    '<div><b>Date of Travel:</b> ' + escapeHtml(formatTravelDate(program.startDate)) + ' – ' + escapeHtml(formatTravelDate(program.endDate)) + '</div>' +
    '<div><b>Outbound BKK → PBH:</b> ' + escapeHtml(flightOut) + '</div>' +
    '<div><b>Inbound PBH → BKK:</b> ' + escapeHtml(flightBack) + '</div>' +
    '</div><footer>52/38 11th Floor, Soi Saladaeng 2, Silom, Bangrak, Bangkok 10500 · info@bhutancenter.com · www.bhutancenter.com · LICENSE NUMBER: 11/07261</footer></section>' +
    whyPage + dayPages + '</body></html>';
}

function openFullProgram(program: TourProgram, autoPrint = false) {
  const docWindow = window.open('', '_blank');
  if (!docWindow) {
    window.alert('เบราว์เซอร์บล็อกหน้าต่างเอกสาร กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้');
    return;
  }
  docWindow.document.open();
  docWindow.document.write(fullProgramHtml(program));
  docWindow.document.close();
  docWindow.focus();
  if (autoPrint) window.setTimeout(() => docWindow.print(), 350);
}

export function TourProgramBuilder({ currentUser, trackings, programs, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<TourProgram>(() => programs[0] || createProgram(currentUser));
  const linkedTracking = useMemo(() => trackings.find((x) => x.id === editing.trackingId), [trackings, editing.trackingId]);
  const canFinalize = Boolean(linkedTracking?.bookingConfirmedAt && (linkedTracking?.visaReceivedAt || linkedTracking?.visaSentAt));
  const totalDays = Math.max(1, diffTourDays(editing.startDate, editing.endDate));

  const set = <K extends keyof TourProgram>(key: K, value: TourProgram[K]) => setEditing((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  const rebuild = (patch?: Partial<TourProgram>) => {
    setEditing((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      const total = Math.max(1, diffTourDays(next.startDate, next.endDate));
      const titled = { ...next, title: programNameFor(total, next.cities) };
      return { ...titled, days: generateTourProgramDays(titled) };
    });
  };

  const setDuration = (days: number) => {
    if (!editing.startDate) return;
    rebuild({ endDate: addDays(editing.startDate, days - 1), cities: STANDARD_CITIES[days] || editing.cities });
  };

  async function save(status: 'draft' | 'final') {
    if (!editing.customerName.trim()) return window.alert('กรุณาระบุชื่อลูกค้าหรือเชื่อมกับ Booking ก่อน');
    if (status === 'final' && !canFinalize) return window.alert('Final Itinerary จะออกได้เมื่อ Booking Confirmed และมี Visa Received/Sent แล้ว');
    const next: TourProgram = {
      ...editing,
      status,
      finalizedAt: status === 'final' ? (editing.finalizedAt || new Date().toISOString()) : '',
      updatedAt: new Date().toISOString(),
    };
    await onSave(next);
    setEditing(next);
  }

  const updateDay = (id: string, patch: Partial<TourProgramDay>) => set('days', editing.days.map((day) => day.id === id ? { ...day, ...patch } : day));
  const toggleCity = (city: string) => {
    const next = editing.cities.includes(city) ? editing.cities.filter((x) => x !== city) : [...editing.cities, city];
    rebuild({ cities: next });
  };

  return <div className="admin-stack tour-program-builder">
    <section className="admin-hero tour-program-hero">
      <div>
        <span className="eyebrow"><MapPinned/> TOUR PROGRAM BUILDER</span>
        <h2>สร้างโปรแกรมทัวร์จากวันเดินทางจริง</h2>
        <p>กำหนดวันเดินทาง · เวลาเที่ยวบิน · เมือง · เทศกาล แล้วจัด Day 1–{totalDays} ให้เหมาะกับเวลาเที่ยว</p>
      </div>
      <div className="tour-program-actions">
        <button className="ghost-button" onClick={() => setEditing(createProgram(currentUser))}><Plus/>สร้างใหม่</button>
        <button className="ghost-button" onClick={() => openFullProgram(editing, false)}><FileText/>ดูโปรแกรมฉบับเต็ม</button>\n        <button className="ghost-button" onClick={() => openFullProgram(editing, true)}><Printer/>พิมพ์ / PDF</button>
        <button className="primary-button" onClick={() => save('draft')}><Save/>บันทึก Draft</button>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 1</span><h3>ข้อมูลลูกค้าและวันเดินทาง</h3></div><span className="count-badge">{totalDays} วัน {Math.max(0, totalDays - 1)} คืน</span></div>
      <div className="editor-form">
        <label className="field"><span>เชื่อมกับ Booking / Customer Journey</span><select value={editing.trackingId} onChange={(e) => {
          const tracking = trackings.find((item) => item.id === e.target.value);
          const patch: Partial<TourProgram> = {
            trackingId: e.target.value,
            customerName: tracking?.customerName || editing.customerName,
            startDate: tracking?.travelStartDate || editing.startDate,
            endDate: tracking?.travelEndDate || editing.endDate,
            hotelCategory: tracking?.hotelCategory || editing.hotelCategory,
          };
          rebuild(patch);
        }}><option value="">— ไม่เชื่อม Booking —</option>{trackings.map((item) => <option key={item.id} value={item.id}>{item.customerName} · {item.travelStartDate || '-'} · {item.packageName || 'Custom trip'}</option>)}</select></label>

        <div className="form-grid">
          <label className="field"><span>ชื่อลูกค้า</span><input value={editing.customerName} onChange={(e) => set('customerName', e.target.value)}/></label>
          <label className="field"><span>ชื่อโปรแกรม</span><input value={editing.title} readOnly/><small>4D3N = JOURNEY TO BHUTAN · 5D4N = WONDERS OF BHUTAN · 6D5N = THE ULTIMATE BHUTAN · มากกว่า 6 วันหรือปรับเส้นทาง = Custom to Bhutan</small></label>
          <label className="field"><span>วันเดินทางไป</span><input type="date" value={editing.startDate} onChange={(e) => rebuild({ startDate: e.target.value })}/></label>
          <label className="field"><span>วันเดินทางกลับ</span><input type="date" value={editing.endDate} onChange={(e) => rebuild({ endDate: e.target.value })}/></label>
        </div>

        <div className="tour-program-presets">
          <span>ระยะเวลามาตรฐาน</span>
          <button className={totalDays === 4 ? 'active' : ''} onClick={() => setDuration(4)}>4 วัน 3 คืน</button>
          <button className={totalDays === 5 ? 'active' : ''} onClick={() => setDuration(5)}>5 วัน 4 คืน</button>
          <button className={totalDays === 6 ? 'active' : ''} onClick={() => setDuration(6)}>6 วัน 5 คืน</button>
          <button className={! [4,5,6].includes(totalDays) ? 'active' : ''} type="button">กำหนดเอง</button>
        </div>

        <label className="field"><span>ระดับโรงแรม</span><select value={editing.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
        <div className="field"><span>เมืองที่ต้องการในทริป</span><div className="tour-city-picker">{CITY_OPTIONS.map((city) => <button key={city} type="button" className={editing.cities.includes(city) ? 'active' : ''} onClick={() => toggleCity(city)}>{city}</button>)}</div><small>กฎเส้นทาง: วันก่อนเดินทางกลับต้องเป็น Paro – Taktsang และพักคืนสุดท้ายที่ Paro เสมอ เพราะสนามบินระหว่างประเทศอยู่ที่ Paro</small></div>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 2</span><h3>เที่ยวบินไป–กลับ</h3></div></div>
      <div className="tour-flight-grid">
        <div className="tour-flight-card"><b>BKK → PBH</b><small>เที่ยวบินขาไป</small>
          <label className="field"><span>Flight No.</span><input value={editing.outboundFlight.flightNo} onChange={(e) => set('outboundFlight', { ...editing.outboundFlight, flightNo: e.target.value })}/></label>
          <div className="form-grid"><label className="field"><span>เวลาออก</span><input type="time" value={editing.outboundFlight.departureTime} onChange={(e) => set('outboundFlight', { ...editing.outboundFlight, departureTime: e.target.value })}/></label><label className="field"><span>เวลาถึง</span><input type="time" value={editing.outboundFlight.arrivalTime} onChange={(e) => rebuild({ outboundFlight: { ...editing.outboundFlight, arrivalTime: e.target.value } })}/></label></div>
        </div>
        <div className="tour-flight-card"><b>PBH → BKK</b><small>เที่ยวบินขากลับ</small>
          <label className="field"><span>Flight No.</span><input value={editing.inboundFlight.flightNo} onChange={(e) => set('inboundFlight', { ...editing.inboundFlight, flightNo: e.target.value })}/></label>
          <div className="form-grid"><label className="field"><span>เวลาออก</span><input type="time" value={editing.inboundFlight.departureTime} onChange={(e) => rebuild({ inboundFlight: { ...editing.inboundFlight, departureTime: e.target.value } })}/></label><label className="field"><span>เวลาถึง</span><input type="time" value={editing.inboundFlight.arrivalTime} onChange={(e) => set('inboundFlight', { ...editing.inboundFlight, arrivalTime: e.target.value })}/></label></div>
        </div>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 3</span><h3>เทศกาลพิเศษ</h3></div></div>
      <div className="editor-form">
        <label className="tour-toggle"><input type="checkbox" checked={Boolean(editing.options.includeFestival)} onChange={(e) => set('options', { ...editing.options, includeFestival: e.target.checked })}/><span><b>ทริปนี้มีเทศกาลที่ลูกค้าต้องการชม</b><small>ระบบจะวางเทศกาลไว้ในวันจริงก่อนจัดสถานที่เที่ยวอื่น</small></span></label>
        {Boolean(editing.options.includeFestival) && <div className="form-grid"><label className="field"><span>ชื่อเทศกาล</span><input value={String(editing.options.festivalName || '')} onChange={(e) => set('options', { ...editing.options, festivalName: e.target.value })}/></label><label className="field"><span>วันที่เทศกาล</span><input type="date" value={String(editing.options.festivalDate || '')} onChange={(e) => rebuild({ options: { ...editing.options, festivalDate: e.target.value } })}/></label></div>}
        <button className="primary-button tour-generate" onClick={() => rebuild()}><Sparkles/>จัดโปรแกรม Day 1–{totalDays} ใหม่</button>
      </div>
    </section>

    <section className="tour-days">
      {editing.days.map((day) => <section className="panel-card tour-day-card" key={day.id}>
        <div className="tour-day-head"><div className="tour-day-number">DAY<br/><b>{day.dayNumber}</b></div><div><span>{day.date || '-'}</span><h3>{day.title}</h3></div><CalendarDays/></div>
        <div className="editor-form">
          <div className="form-grid"><label className="field"><span>เมืองหลัก</span><select value={day.city} onChange={(e) => updateDay(day.id, { city: e.target.value })}>{CITY_OPTIONS.map((city) => <option key={city}>{city}</option>)}</select></label><label className="field"><span>หัวข้อวันนี้</span><input value={day.title} onChange={(e) => updateDay(day.id, { title: e.target.value })}/></label></div>
          <label className="field"><span>สถานที่ / กิจกรรม — 1 บรรทัดต่อ 1 รายการ</span><textarea rows={5} value={day.activities.join('\n')} onChange={(e) => updateDay(day.id, { activities: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}/></label>
          <div className="tour-meals">
            <span>อาหาร</span>
            {(['breakfast','lunch','dinner'] as const).map((meal) => <label key={meal}><input type="checkbox" checked={day.meals[meal]} onChange={(e) => updateDay(day.id, { meals: { ...day.meals, [meal]: e.target.checked } })}/>{meal === 'breakfast' ? 'เช้า' : meal === 'lunch' ? 'กลางวัน' : 'เย็น'}</label>)}
          </div>
          <div className="form-grid"><label className="field"><span>โรงแรม</span><input value={day.hotel} onChange={(e) => updateDay(day.id, { hotel: e.target.value })}/></label><label className="field"><span>หมายเหตุ / การเดินทาง</span><input value={day.note} onChange={(e) => updateDay(day.id, { note: e.target.value })}/></label></div>
        </div>
      </section>)}
    </section>

    <section className="panel-card tour-final-card">
      <div className="panel-heading"><div><span>FINAL ITINERARY</span><h3>ข้อมูลส่งมอบก่อนเดินทาง</h3></div>{editing.status === 'final' ? <CheckCircle2/> : <FileText/>}</div>
      <div className={canFinalize ? 'tour-final-status ready' : 'tour-final-status'}>{canFinalize ? 'พร้อมออก Final Itinerary' : 'รอ Booking Confirmed และ Visa Received/Sent ก่อนออก Final'}</div>
      <div className="form-grid"><label className="field"><span>ชื่อไกด์</span><input value={editing.guideName} onChange={(e) => set('guideName', e.target.value)}/></label><label className="field"><span>เบอร์ติดต่อไกด์</span><input value={editing.guideContact} onChange={(e) => set('guideContact', e.target.value)}/></label><label className="field"><span>Room Type</span><input value={editing.roomType} onChange={(e) => set('roomType', e.target.value)}/></label><label className="field"><span>หมายเหตุรวม</span><input value={editing.note} onChange={(e) => set('note', e.target.value)}/></label></div>
      <div className="modal-actions"><button className="ghost-button" onClick={() => save('draft')}><Save/>บันทึก Draft</button><button className="primary-button" disabled={!canFinalize} onClick={() => save('final')}><CheckCircle2/>ออก Final Itinerary</button></div>
    </section>

    {programs.length > 0 && <section className="panel-card no-padding">
      <div className="panel-heading tour-list-heading"><div><span>SAVED PROGRAMS</span><h3>โปรแกรมที่บันทึกไว้</h3></div><span className="count-badge">{programs.length}</span></div>
      <div className="tour-program-list">{programs.map((program) => <div className="tour-program-row" key={program.id}><button className="tour-program-open" onClick={() => setEditing(program)}><span><b>{program.customerName || program.title}</b><small>{program.startDate} – {program.endDate} · {program.cities.join(' → ')}</small></span><em className={program.status}>{program.status === 'final' ? 'FINAL' : 'DRAFT'}</em></button><button className="icon-button danger" onClick={() => onDelete(program.id)} aria-label="ลบโปรแกรม"><Trash2/></button></div>)}</div>
    </section>}
  </div>;
}
