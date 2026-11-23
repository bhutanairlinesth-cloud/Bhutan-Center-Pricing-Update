import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, MapPinned, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { CustomerTracking, HotelCategory, TourProgram, TourProgramDay, User } from '../types';
import { diffTourDays, generateTourProgramDays, getPenultimateProgram, programNameFor, STANDARD_CITIES } from '../lib/tourProgramRules';
import { dayJourneyLead, storyPlacesForDay } from '../lib/tourProgramStory';

type Props = {
  currentUser: User;
  trackings: CustomerTracking[];
  programs: TourProgram[];
  onSave: (program: TourProgram) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const CITY_OPTIONS = ['Paro', 'Thimphu', 'Punakha', 'Gangtey'];

const uid = (prefix: string) => prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: string, offset: number) => {
  if (!date) return '';
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + offset);
  return isoDate(d);
};

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
    options: { includeFestival: false, festivalName: '', festivalDate: '', penultimateProgram: 'taktsang' },
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



const COVER_IMAGE = '/images/hero-bhutan.png';

function fullProgramHtml(program: TourProgram) {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const programTitle = programNameFor(total, program.cities, program.options);
  const duration = total + ' วัน ' + Math.max(0, total - 1) + ' คืน';
  const penultimateProgram = getPenultimateProgram(program.options);
  const finalHighlight = penultimateProgram === 'haa' ? 'ฮา' : 'ทักซัง';
  const route = programTitle === 'THE ULTIMATE BHUTAN'
    ? 'พาโร · ทิมพู · พูนาคา · กังเต · ' + finalHighlight
    : programTitle === 'Custom to Bhutan'
      ? (program.cities.join(' · ') + ' · พาโร · ' + finalHighlight)
      : 'พาโร · ทิมพู · พูนาคา · ' + finalHighlight;

  const flightOut = (program.outboundFlight.flightNo || '-') + '  ' + (program.outboundFlight.departureTime || '-') + ' – ' + (program.outboundFlight.arrivalTime || '-');
  const flightBack = (program.inboundFlight.flightNo || '-') + '  ' + (program.inboundFlight.departureTime || '-') + ' – ' + (program.inboundFlight.arrivalTime || '-');

  const overviewStops = program.days.map((day, index) => {
    const places = storyPlacesForDay(day);
    const primary = places[0];
    return '<div class="overview-stop ' + (index % 2 === 0 ? 'left' : 'right') + '">' +
      '<div class="overview-copy">' +
        '<small>DAY ' + day.dayNumber + ' · ' + escapeHtml(formatTravelDate(day.date)) + '</small>' +
        '<h3>' + escapeHtml(day.title) + '</h3>' +
        '<p>' + escapeHtml(dayJourneyLead(day)) + '</p>' +
      '</div>' +
      '<div class="overview-image"><img src="' + escapeHtml(primary?.image || COVER_IMAGE) + '" alt="' + escapeHtml(primary?.title || day.title) + '"></div>' +
      '<div class="overview-node">' + (index + 1) + '</div>' +
    '</div>';
  }).join('');

  const journeyOverview =
    '<section class="page story-overview">' +
      '<div class="paper-grain"></div>' +
      '<header class="editorial-header">' +
        '<div><img src="/images/bhutan-center-logo.png" alt="Bhutan Center"><span><b>BHUTAN CENTER</b><small>OMG EXPERIENCE</small></span></div>' +
        '<em>A STORY OF THE JOURNEY</em>' +
      '</header>' +
      '<div class="overview-intro">' +
        '<span>เส้นทางของเรา</span>' +
        '<h2>' + escapeHtml(programTitle) + '</h2>' +
        '<p>การเดินทางครั้งนี้ไม่ได้ถูกออกแบบให้เป็นเพียงรายการสถานที่ แต่เป็นเรื่องราวที่ค่อย ๆ เปิดออกจากพาโร สู่เมืองหลวง หุบเขาเก่าแก่ และไฮไลต์สุดท้ายก่อนกลับกรุงเทพฯ</p>' +
      '</div>' +
      '<div class="overview-route">' + overviewStops + '<div class="overview-line"></div></div>' +
      '<footer><span>BHUTAN CENTER</span><span>www.bhutancenter.com</span><span>LICENSE 11/07261</span></footer>' +
    '</section>';

  const dayPages = program.days.map((day, dayIndex) => {
    const places = storyPlacesForDay(day);
    const hero = places[0];
    const secondary = places[1] || places[0];
    const tertiary = places[2] || places[1] || places[0];

    const storyCards = places.map((place, index) => {
      const alignment = index % 2 === 0 ? 'story-row normal' : 'story-row reverse';
      return '<div class="' + alignment + '">' +
        '<div class="story-photo-wrap">' +
          '<img src="' + escapeHtml(place.image) + '" alt="' + escapeHtml(place.title) + '">' +
          '<span class="photo-index">0' + (index + 1) + '</span>' +
        '</div>' +
        '<div class="story-copy">' +
          '<small>' + escapeHtml(place.subtitle) + '</small>' +
          '<h3>' + escapeHtml(place.title) + '</h3>' +
          '<p>' + escapeHtml(place.story) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');

    const activityTags = day.activities.slice(0, 6).map((item) =>
      '<span>' + escapeHtml(item) + '</span>'
    ).join('');

    const mealTags =
      (day.meals.breakfast ? '<b>เช้า</b>' : '') +
      (day.meals.lunch ? '<b>กลางวัน</b>' : '') +
      (day.meals.dinner ? '<b>เย็น</b>' : '');

    return '<section class="page journey-day">' +
      '<div class="paper-grain"></div>' +
      '<div class="day-hero-editorial">' +
        '<img src="' + escapeHtml(hero?.image || COVER_IMAGE) + '" alt="' + escapeHtml(day.title) + '">' +
        '<div class="day-hero-overlay"></div>' +
        '<div class="day-hero-brand">BHUTAN CENTER</div>' +
        '<div class="day-hero-number">DAY <b>' + day.dayNumber + '</b></div>' +
        '<div class="day-hero-copy">' +
          '<small>' + escapeHtml(formatTravelDate(day.date)) + '</small>' +
          '<h2>' + escapeHtml(day.title) + '</h2>' +
          '<p>' + escapeHtml(dayJourneyLead(day)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="day-story-body">' +
        '<div class="journey-thread"><span></span><i></i><span></span></div>' +
        storyCards +
        '<div class="day-summary-band">' +
          '<div><small>วันนี้เราจะพบ</small><div class="activity-tags">' + activityTags + '</div></div>' +
          '<div class="summary-meta">' +
            '<div><small>พักค้างคืน</small><strong>' + escapeHtml(day.hotel || 'Bangkok') + '</strong></div>' +
            '<div><small>อาหาร</small><span class="meal-inline">' + mealTags + '</span></div>' +
            '<div><small>ปลายทางวันนี้</small><strong>' + escapeHtml(day.city) + '</strong></div>' +
          '</div>' +
        '</div>' +
        (day.note ? '<div class="travel-note"><b>TRAVEL NOTE</b><span>' + escapeHtml(day.note) + '</span></div>' : '') +
      '</div>' +
      '<footer><span>BHUTAN CENTER</span><span>info@bhutancenter.com</span><span>52/38 Soi Saladaeng 2, Silom, Bangkok</span></footer>' +
    '</section>';
  }).join('');

  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(programTitle) + '</title>' +
    '<style>' +
      '@page{size:A4;margin:0}' +
      '*{box-sizing:border-box}' +
      'html,body{margin:0;padding:0;background:#d9d0c2;color:#3e3026;font-family:Tahoma,"Arial",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'img{display:block;width:100%;height:100%;object-fit:cover}' +
      '.toolbar{position:sticky;top:0;z-index:100;display:flex;gap:10px;justify-content:center;padding:12px;background:#3d3026;box-shadow:0 8px 24px rgba(0,0,0,.2)}' +
      '.toolbar button{border:0;border-radius:999px;padding:11px 20px;font-size:13px;font-weight:800;cursor:pointer}.toolbar .primary{background:#d6a34e;color:#fff}.toolbar .secondary{background:#fff;color:#3d3026}' +
      '.page{width:210mm;height:297mm;margin:14px auto;background:#f6f0e6;position:relative;overflow:hidden;page-break-after:always;box-shadow:0 12px 40px rgba(69,48,31,.18)}' +
      '.paper-grain{position:absolute;inset:0;pointer-events:none;opacity:.16;background-image:radial-gradient(#8c765f .45px,transparent .45px);background-size:4px 4px;mix-blend-mode:multiply}' +
      '.cover{background:#17392f;color:#fff}' +
      '.cover-photo{position:absolute;inset:0 0 auto 0;height:184mm}.cover-photo img{position:absolute;inset:0}.cover-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,31,27,.08),rgba(24,47,39,.38) 55%,#17392f 100%)}' +
      '.cover-top{position:absolute;z-index:3;top:15mm;left:15mm;right:15mm;display:flex;justify-content:space-between;align-items:center}.cover-logo{display:flex;gap:9px;align-items:center}.cover-logo img{width:18mm;height:18mm;border-radius:50%;background:#fff;padding:2mm;object-fit:contain}.cover-logo b{display:block;font-size:17px;letter-spacing:.06em}.cover-logo span{display:block;font-size:9px;opacity:.75;margin-top:2px}.cover-badge{padding:7px 12px;border:1px solid rgba(255,255,255,.5);border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.08em}' +
      '.cover-title{position:absolute;z-index:3;left:16mm;right:16mm;top:104mm}.cover-title .eyebrow{font-size:10px;letter-spacing:.28em;font-weight:900;color:#f3cf87}.cover-title h1{font-family:Georgia,serif;font-size:37px;line-height:1.02;margin:7px 0 4px;text-transform:uppercase}.cover-title h2{font-size:24px;margin:0;color:#f0c87e}.cover-title .route{font-size:14px;margin-top:9px;font-weight:700;letter-spacing:.02em}' +
      '.cover-info{position:absolute;z-index:3;left:15mm;right:15mm;bottom:15mm;background:#fff;color:#3c3128;border-radius:6mm;padding:8mm;display:grid;grid-template-columns:1.15fr .85fr;gap:9mm;box-shadow:0 12px 32px rgba(0,0,0,.2)}.cover-info h3{font-size:15px;margin:0 0 7px;color:#183b31}.info-list{display:grid;gap:5px;font-size:11px}.info-row{display:grid;grid-template-columns:35mm 1fr;gap:5px}.info-row b{color:#8f6f40}.flight-box{display:grid;gap:7px;border-left:1px solid #e5d8c6;padding-left:7mm}.flight{background:#f5eee2;border-radius:4mm;padding:5mm}.flight small{font-size:8px;letter-spacing:.13em;color:#a07736;font-weight:900}.flight strong{display:block;font-size:12px;margin-top:4px}.flight span{display:block;font-size:9px;color:#7d746a;margin-top:2px}' +
      '.editorial-header{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:12mm 15mm 0}.editorial-header>div{display:flex;align-items:center;gap:8px}.editorial-header img{width:13mm;height:13mm;object-fit:contain}.editorial-header b{display:block;font-size:14px;color:#4b3525}.editorial-header small{display:block;font-size:8px;color:#947b63}.editorial-header em{font-family:Georgia,serif;font-size:11px;letter-spacing:.18em;color:#a57c3e}' +
      '.overview-intro{position:relative;z-index:2;padding:9mm 15mm 5mm}.overview-intro>span{font-family:Georgia,serif;font-style:italic;font-size:22px;color:#b17c30}.overview-intro h2{font-family:Georgia,serif;font-size:31px;line-height:1.05;margin:2px 0 5px;color:#493423}.overview-intro p{max-width:150mm;margin:0;font-size:12px;line-height:1.7;color:#6c5b4c}' +
      '.overview-route{position:relative;z-index:2;padding:2mm 15mm 15mm;height:226mm}.overview-line{position:absolute;left:50%;top:12mm;bottom:12mm;border-left:1.5px dashed #9f6f43;opacity:.65}.overview-stop{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10mm;align-items:center;min-height:42mm;margin:2.5mm 0}.overview-stop.left .overview-copy{order:1;text-align:right;padding-right:8mm}.overview-stop.left .overview-image{order:2}.overview-stop.right .overview-copy{order:2;text-align:left;padding-left:8mm}.overview-stop.right .overview-image{order:1}.overview-image{height:34mm;border-radius:45% 55% 50% 50%/52% 45% 55% 48%;overflow:hidden;box-shadow:0 7px 18px rgba(72,49,32,.15)}.overview-copy small{font-size:7.5px;letter-spacing:.11em;font-weight:900;color:#a67534}.overview-copy h3{font-family:Georgia,serif;font-size:15px;margin:2px 0 3px;color:#4a3424}.overview-copy p{font-size:8.5px;line-height:1.45;color:#6c5b4e;margin:0}.overview-node{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:7mm;height:7mm;border-radius:50%;background:#a34b2f;color:#fff;border:1.5mm solid #f6f0e6;display:grid;place-items:center;font-size:7px;font-weight:900;z-index:3}' +
      '.day-hero-editorial{height:90mm;position:relative;background:#473a2e}.day-hero-editorial>img{position:absolute;inset:0}.day-hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(27,21,17,.07),rgba(27,21,17,.18) 50%,rgba(35,25,19,.82) 100%)}.day-hero-brand{position:absolute;top:10mm;left:15mm;color:#fff;font-size:10px;font-weight:900;letter-spacing:.12em}.day-hero-number{position:absolute;top:9mm;right:15mm;padding:6px 10px;border:1px solid rgba(255,255,255,.55);border-radius:999px;color:#fff;font-size:9px;letter-spacing:.08em}.day-hero-number b{font-size:13px}.day-hero-copy{position:absolute;left:15mm;right:15mm;bottom:9mm;color:#fff}.day-hero-copy small{font-size:9px;letter-spacing:.13em;font-weight:900;color:#f1ca83}.day-hero-copy h2{font-family:Georgia,serif;font-size:27px;line-height:1.05;margin:3px 0 5px}.day-hero-copy p{max-width:148mm;font-size:11.5px;line-height:1.55;margin:0;color:#f7f2eb}' +
      '.day-story-body{position:relative;padding:9mm 14mm 14mm;height:201mm}.journey-thread{position:absolute;left:50%;top:10mm;bottom:43mm;width:1px;border-left:1.5px dashed #a06042;opacity:.6}.journey-thread span,.journey-thread i{position:absolute;left:50%;transform:translateX(-50%);width:5mm;height:5mm;border-radius:50%;background:#a2482f;border:1.2mm solid #f6f0e6}.journey-thread span:first-child{top:3mm}.journey-thread i{top:50%}.journey-thread span:last-child{bottom:2mm}' +
      '.story-row{position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:11mm;align-items:center;min-height:42mm;margin-bottom:4mm;z-index:2}.story-row.reverse .story-photo-wrap{order:2}.story-row.reverse .story-copy{order:1;text-align:right}.story-photo-wrap{height:39mm;position:relative;border-radius:48% 52% 46% 54%/58% 44% 56% 42%;overflow:hidden;box-shadow:0 8px 20px rgba(76,49,29,.16)}.photo-index{position:absolute;bottom:3mm;right:4mm;font-family:Georgia,serif;font-size:26px;font-style:italic;color:rgba(255,255,255,.85);text-shadow:0 2px 9px rgba(0,0,0,.35)}.story-copy small{font-size:7.5px;letter-spacing:.11em;font-weight:900;color:#a46f2f}.story-copy h3{font-family:Georgia,serif;font-size:17px;margin:2px 0 4px;color:#513725}.story-copy p{font-size:9.5px;line-height:1.52;color:#66564a;margin:0}' +
      '.day-summary-band{position:absolute;left:14mm;right:14mm;bottom:16mm;display:grid;grid-template-columns:1.25fr .75fr;gap:7mm;background:rgba(255,252,247,.94);border-top:1px solid #d9c6ae;padding-top:5mm}.day-summary-band>div>small,.summary-meta small{display:block;font-size:7.5px;letter-spacing:.12em;font-weight:900;color:#aa7434}.activity-tags{display:flex;flex-wrap:wrap;gap:2mm;margin-top:2mm}.activity-tags span{font-size:7.5px;border:1px solid #d8c4a8;border-radius:999px;padding:1.4mm 2.3mm;background:#fff;color:#6d5949}.summary-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.summary-meta strong{display:block;font-size:9px;color:#4c3728;margin-top:2px}.meal-inline{display:flex;gap:1mm;flex-wrap:wrap;margin-top:2px}.meal-inline b{font-size:7px;background:#21493d;color:#fff;border-radius:999px;padding:1mm 1.8mm}.travel-note{position:absolute;left:14mm;bottom:8mm;font-size:8px;color:#766455}.travel-note b{color:#a26b2e;margin-right:5px}' +
      'footer{position:absolute;left:14mm;right:14mm;bottom:5mm;display:flex;justify-content:space-between;gap:8px;border-top:1px solid #d9cdbd;padding-top:2.5mm;color:#847466;font-size:7px}.cover footer{color:rgba(255,255,255,.72);border-color:rgba(255,255,255,.25)}' +
      '@media print{html,body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}}' +
    '</style></head><body>' +
      '<div class="toolbar"><button class="primary" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><button class="secondary" onclick="window.close()">ปิด</button></div>' +
      '<section class="page cover">' +
        '<div class="cover-photo"><img src="' + COVER_IMAGE + '" alt="Bhutan landscape"></div>' +
        '<div class="cover-top">' +
          '<div class="cover-logo"><img src="/images/bhutan-center-logo.png" alt="Bhutan Center"><div><b>BHUTAN CENTER</b><span>OMG EXPERIENCE</span></div></div>' +
          '<div class="cover-badge">PRIVATE JOURNEY</div>' +
        '</div>' +
        '<div class="cover-title">' +
          '<div class="eyebrow">DISCOVER THE KINGDOM OF HAPPINESS</div>' +
          '<h1>' + escapeHtml(programTitle) + '</h1>' +
          '<h2>' + escapeHtml(duration) + '</h2>' +
          '<div class="route">' + escapeHtml(route) + '</div>' +
        '</div>' +
        '<div class="cover-info">' +
          '<div><h3>TRAVEL INFORMATION</h3><div class="info-list">' +
            '<div class="info-row"><b>Customer</b><span>' + escapeHtml(program.customerName || '-') + '</span></div>' +
            '<div class="info-row"><b>Date of Travel</b><span>' + escapeHtml(formatTravelDate(program.startDate)) + ' – ' + escapeHtml(formatTravelDate(program.endDate)) + '</span></div>' +
            '<div class="info-row"><b>Guide</b><span>' + escapeHtml(program.guideName || '-') + '</span></div>' +
            '<div class="info-row"><b>Guide Contact</b><span>' + escapeHtml(program.guideContact || '-') + '</span></div>' +
            '<div class="info-row"><b>Room Type</b><span>' + escapeHtml(program.roomType || '-') + '</span></div>' +
          '</div></div>' +
          '<div class="flight-box">' +
            '<div class="flight"><small>OUTBOUND · BKK → PBH</small><strong>' + escapeHtml(flightOut) + '</strong><span>Bangkok to Paro</span></div>' +
            '<div class="flight"><small>INBOUND · PBH → BKK</small><strong>' + escapeHtml(flightBack) + '</strong><span>Paro to Bangkok</span></div>' +
          '</div>' +
        '</div>' +
        '<footer><span>BHUTAN CENTER</span><span>www.bhutancenter.com</span><span>LICENSE 11/07261</span></footer>' +
      '</section>' +
      journeyOverview + dayPages +
    '</body></html>';
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
  if (autoPrint) {
    const images = Array.from(docWindow.document.images);
    Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }))).then(() => window.setTimeout(() => docWindow.print(), 250));
  }
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
      const titled = { ...next, title: programNameFor(total, next.cities, next.options) };
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
          <label className="field"><span>ชื่อโปรแกรม</span><input value={editing.title} readOnly/><small>4D3N = JOURNEY TO BHUTAN · 5D4N = WONDERS OF BHUTAN · 6D5N = THE ULTIMATE BHUTAN · หากเปลี่ยนวันก่อนกลับเป็น Haa หรือปรับเส้นทาง = Custom to Bhutan</small></label>
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
        <div className="field">
  <span>เมืองหลักในทริป</span>
  <div className="tour-city-picker">{CITY_OPTIONS.map((city) => <button key={city} type="button" className={editing.cities.includes(city) ? 'active' : ''} onClick={() => toggleCity(city)}>{city}</button>)}</div>
  <small>เลือกเมืองหลักที่ต้องการเดินทาง: Paro / Thimphu / Punakha / Gangtey</small>
</div>
<div className="field">
  <span>โปรแกรมวันก่อนเดินทางกลับ</span>
  <div className="tour-city-picker">
    <button type="button" className={getPenultimateProgram(editing.options) === 'taktsang' ? 'active' : ''} onClick={() => rebuild({ options: { ...editing.options, penultimateProgram: 'taktsang' } })}>Taktsang / Tiger’s Nest</button>
    <button type="button" className={getPenultimateProgram(editing.options) === 'haa' ? 'active' : ''} onClick={() => rebuild({ options: { ...editing.options, penultimateProgram: 'haa' } })}>Haa Valley</button>
  </div>
  <small>{getPenultimateProgram(editing.options) === 'haa' ? 'Day ก่อนกลับ: Paro → Haa → Paro และกลับมาพักคืนสุดท้ายที่ Paro' : 'Day ก่อนกลับ: Paro → Taktsang และพักคืนสุดท้ายที่ Paro'}</small>
</div>
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
