import { TourProgramDay } from '../types';

export type StoryPlace = {
  key: string;
  title: string;
  eyebrow: string;
  story: string;
  image: string;
};

const commons = (fileName: string) =>
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + encodeURIComponent(fileName);

export const STORY_PLACES: StoryPlace[] = [
  {
    key: 'paro-airport',
    title: 'Arrival in Paro',
    eyebrow: 'PARO · THE GATEWAY TO BHUTAN',
    story: 'เดินทางถึงเมืองพาโร เมืองแรกของทริปและประตูสู่ภูฏาน หลังผ่านพิธีการตรวจคนเข้าเมือง พบไกด์ท้องถิ่น ก่อนเริ่มเที่ยวพาโรและเดินทางต่อสู่ทิมพู',
    image: commons('Bhutan Airlines Airbus A319 (A5-BAC) at Paro Airport.jpg'),
  },
  {
    key: 'rinpung',
    title: 'Rinpung Dzong',
    eyebrow: 'PARO · FORTRESS & MONASTERY',
    story: 'เยี่ยมชม Rinpung Dzong ป้อมปราการและอารามสำคัญของพาโร โดดเด่นด้วยสถาปัตยกรรมภูฏานดั้งเดิม และยังคงเป็นศูนย์กลางสำคัญของเมืองจนถึงปัจจุบัน',
    image: commons('Rinpung Dzong, Paro, Bhutan.jpg'),
  },
  {
    key: 'national-museum',
    title: 'National Museum',
    eyebrow: 'PARO · TA DZONG',
    story: 'ชมพิพิธภัณฑสถานแห่งชาติ ซึ่งตั้งอยู่ในอาคาร Ta Dzong เดิม ภายในรวบรวมเรื่องราวประวัติศาสตร์ ศิลปะ วัฒนธรรม และวิถีชีวิตของชาวภูฏาน',
    image: commons('National Museum of Bhutan 01.jpg'),
  },
  {
    key: 'buddha',
    title: 'Buddha Dordenma',
    eyebrow: 'THIMPHU · ABOVE THE CAPITAL',
    story: 'สักการะ Buddha Dordenma พระพุทธรูปขนาดใหญ่เหนือเมืองทิมพู พร้อมชมวิวเมืองหลวงและหุบเขาโดยรอบจากมุมสูง',
    image: commons('Thimphu-Buddha Dordenma-02-2015-gje.jpg'),
  },
  {
    key: 'takin',
    title: 'Motithang Takin Preserve',
    eyebrow: 'THIMPHU · NATIONAL ANIMAL',
    story: 'ชมทาคิน สัตว์ประจำชาติของภูฏาน ณ Motithang Takin Preserve อีกหนึ่งจุดที่สะท้อนความผูกพันระหว่างชาวภูฏานกับธรรมชาติ',
    image: commons('Takins at Motithang Takin Preserve, Bhutan.jpg'),
  },
  {
    key: 'dochula',
    title: 'Dochula Pass',
    eyebrow: 'BETWEEN THIMPHU & PUNAKHA',
    story: 'แวะ Dochula Pass บนเส้นทางจากทิมพูสู่พูนาคา ชมเจดีย์ Druk Wangyal 108 องค์ และหากท้องฟ้าเปิด จะมองเห็นแนวเทือกเขาหิมาลัยได้อย่างชัดเจน',
    image: commons('Some of 108 chortens, Dochula pass.jpg'),
  },
  {
    key: 'chimi',
    title: 'Chimi Lhakhang',
    eyebrow: 'PUNAKHA · LOCAL FAITH & STORIES',
    story: 'แวะ Chimi Lhakhang วัดกลางหุบเขาที่มีชื่อเสียงจากเรื่องราวของ Drukpa Kunley หรือ Divine Madman และเป็นหนึ่งในวัดที่ชาวภูฏานให้ความศรัทธา',
    image: commons('Chimi Lhakhang, Bhutan 01.jpg'),
  },
  {
    key: 'punakha-dzong',
    title: 'Punakha Dzong',
    eyebrow: 'PUNAKHA · THE OLD CAPITAL',
    story: 'เดินทางถึงพูนาคา อดีตเมืองหลวงของภูฏาน และชม Punakha Dzong ซองสำคัญที่ตั้งอยู่ตรงจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu งดงามทั้งด้านสถาปัตยกรรมและประวัติศาสตร์',
    image: commons('Punakha dzong.jpg'),
  },
  {
    key: 'punakha-bridge',
    title: 'Punakha Suspension Bridge',
    eyebrow: 'PUNAKHA · ACROSS THE RIVER',
    story: 'เดินชม Punakha Suspension Bridge สะพานแขวนเหนือแม่น้ำที่ประดับด้วยธงมนต์ พร้อมชมวิวหุบเขาและธรรมชาติรอบเมืองพูนาคา',
    image: commons('Punakha 3-69, suspension bridge.jpg'),
  },
  {
    key: 'simtokha',
    title: 'Simtokha Dzong',
    eyebrow: 'RETURNING WEST · HISTORIC DZONG',
    story: 'ระหว่างเดินทางกลับสู่พาโร แวะ Simtokha Dzong หนึ่งในซองเก่าแก่ของภูฏาน ก่อนเดินทางต่อผ่านทิมพูและกลับเข้าสู่หุบเขาพาโร',
    image: commons('Simtokha Dzong, Bhutan 01.jpg'),
  },
  {
    key: 'paro-valley',
    title: 'Back to Paro Valley',
    eyebrow: 'PARO · THE FINAL CHAPTER',
    story: 'กลับเข้าสู่เมืองพาโรและเข้าพักในคืนสุดท้ายของทริป เพื่อให้พร้อมสำหรับโปรแกรมสำคัญในวันถัดไป และเดินทางสู่สนามบินได้สะดวกในวันกลับ',
    image: commons('The view of PARO Valley, Bhutan from above (34225469743).jpg'),
  },
  {
    key: 'taktsang',
    title: 'Taktsang · Tiger’s Nest',
    eyebrow: 'PARO · THE ICONIC HIGHLIGHT',
    story: 'วันนี้เป็นไฮไลต์ของทริปกับการเดินขึ้น Taktsang หรือ Tiger’s Nest วัดศักดิ์สิทธิ์ที่ตั้งอยู่บนหน้าผาเหนือหุบเขาพาโร ใช้เวลาเดินทางอย่างเต็มที่ ก่อนกลับมาพักที่พาโรในช่วงเย็น',
    image: commons('Bhutan-Paro-116-Taktshang-Tigernest-gje.jpg'),
  },
  {
    key: 'taktsang-trail',
    title: 'The Trail to Tiger’s Nest',
    eyebrow: 'TAKTSANG · THE JOURNEY IS PART OF THE STORY',
    story: 'ระหว่างทางสู่วัดทักซัง เราจะเดินผ่านป่าสนและจุดพักต่าง ๆ ก่อนแวะ Taktsang Cafeteria จากนั้นเดินต่อสู่วัดบนหน้าผา ซึ่งเป็นหนึ่งในภาพจำสำคัญที่สุดของภูฏาน',
    image: commons('On the way to Paro Taktsang - The Tiger Nest (14).jpg'),
  },
  {
    key: 'kyichu',
    title: 'Kyichu Lhakhang',
    eyebrow: 'PARO · A QUIET FAREWELL',
    story: 'เช้าวันสุดท้าย แวะสักการะ Kyichu Lhakhang หนึ่งในวัดเก่าแก่ของพาโร ก่อนเดินทางสู่สนามบินนานาชาติพาโรเพื่อเดินทางกลับกรุงเทพฯ',
    image: commons('Bouthan-Paro-temple kyichu lhakhang.JPG'),
  },
  {
    key: 'paro-town',
    title: 'A Final Glimpse of Paro',
    eyebrow: 'PARO · BEFORE DEPARTURE',
    story: 'อิสระเดินเล่นย่านใจกลางเมืองพาโร เลือกซื้อของที่ระลึก และเก็บบรรยากาศช่วงสุดท้ายก่อนเดินทางไปสนามบิน',
    image: commons('View of Paro from Tenchen Gonpa.jpg'),
  },
  {
    key: 'gangtey-monastery',
    title: 'Gangtey Monastery',
    eyebrow: 'GANGTEY · ABOVE PHOBJIKHA',
    story: 'เยี่ยมชม Gangtey Monastery อารามสำคัญที่ตั้งอยู่เหนือหุบเขาโฟบจิกา พร้อมชมทิวทัศน์กว้างของพื้นที่โดยรอบ',
    image: commons('Gangtey Gompa Bhutan.jpg'),
  },
  {
    key: 'phobjikha',
    title: 'Phobjikha Valley',
    eyebrow: 'PHOBJIKHA · THE QUIET VALLEY',
    story: 'ชมความงดงามของ Phobjikha Valley หุบเขากว้างที่โอบล้อมด้วยป่าสนและทุ่งหญ้า บรรยากาศเงียบสงบและเป็นธรรมชาติ',
    image: commons('Phobjikha valley.jpg'),
  },
  {
    key: 'haa',
    title: 'Haa Valley',
    eyebrow: 'HAA · A QUIETER ALTERNATIVE',
    story: 'กรณีเลือก Haa Valley เดินทางจากพาโรสู่หุบเขาฮา ชมธรรมชาติและวิถีท้องถิ่น ก่อนเดินทางกลับมาพักที่พาโรในช่วงเย็น',
    image: commons('Haa valley, Ha - during LGFC - Bhutan 2019 (1).jpg'),
  },
  {
    key: 'haa-detail',
    title: 'Across Haa Valley',
    eyebrow: 'HAA · LANDSCAPE & LOCAL LIFE',
    story: 'ใช้เวลาเที่ยว Haa Valley ท่ามกลางภูเขา หมู่บ้าน และทิวทัศน์ชนบทของภูฏาน ก่อนเดินทางกลับสู่พาโรเพื่อพักค้างคืน',
    image: commons('HaaValley.jpg'),
  },
];

const PLACE_BY_KEY = Object.fromEntries(STORY_PLACES.map((place) => [place.key, place])) as Record<string, StoryPlace>;

const normalizedTitle = (day: TourProgramDay) => day.title.toLowerCase().replace(/[–—]/g, '-');
const activityText = (day: TourProgramDay) => day.activities.join(' ').toLowerCase();

function plannedKeysForDay(day: TourProgramDay): string[] {
  const title = normalizedTitle(day);
  const activities = activityText(day);

  if (title.includes('taktsang') || activities.includes('tiger')) return ['taktsang', 'taktsang-trail'];
  if (title.includes('haa') || activities.includes('haa valley')) return ['haa', 'haa-detail'];

  const isArrival = title.includes('bangkok') && title.indexOf('bangkok') < title.indexOf('paro');
  if (isArrival) {
    const keys = ['paro-airport', 'rinpung'];
    if (activities.includes('national museum')) keys.push('national-museum');
    if (activities.includes('buddha dordenma')) keys.push('buddha');
    return keys;
  }

  const isDeparture = title.includes('bangkok') && title.indexOf('paro') < title.indexOf('bangkok');
  if (isDeparture) return ['kyichu', 'paro-town'];

  if (title.includes('gangtey') || title.includes('phobjikha') || activities.includes('phobjikha')) {
    return ['gangtey-monastery', 'phobjikha'];
  }

  const thimphuToPunakha = title.includes('thimphu') && title.includes('punakha') && title.indexOf('thimphu') < title.indexOf('punakha');
  if (thimphuToPunakha) {
    const keys = ['dochula'];
    if (activities.includes('chimi')) keys.push('chimi');
    if (activities.includes('punakha dzong')) keys.push('punakha-dzong');
    if (activities.includes('suspension bridge')) keys.push('punakha-bridge');
    return keys;
  }

  const returningToParo = title.includes('paro') && (title.includes('punakha') || title.includes('thimphu'));
  if (returningToParo) return ['simtokha', 'paro-valley'];

  const keys: string[] = [];
  if (activities.includes('takin')) keys.push('takin');
  if (activities.includes('dochula')) keys.push('dochula');
  if (activities.includes('punakha dzong')) keys.push('punakha-dzong');
  if (activities.includes('simtokha')) keys.push('simtokha');
  if (activities.includes('kyichu')) keys.push('kyichu');
  return keys.length ? keys : ['paro-valley'];
}

export function storyPlacesForProgram(days: TourProgramDay[]): StoryPlace[][] {
  const used = new Set<string>();

  return days.map((day) => {
    const planned = plannedKeysForDay(day);
    const selected: StoryPlace[] = [];

    for (const key of planned) {
      if (used.has(key) || !PLACE_BY_KEY[key]) continue;
      selected.push(PLACE_BY_KEY[key]);
      used.add(key);
      if (selected.length === 3) break;
    }

    return selected;
  });
}

export function dayJourneyLead(day: TourProgramDay) {
  const title = normalizedTitle(day);

  if (title.includes('taktsang')) {
    return 'วันนี้พบกับไฮไลต์สำคัญของทริป เดินขึ้น Taktsang หรือ Tiger’s Nest ใช้เวลาชมวัดและบรรยากาศบนเส้นทางอย่างเต็มที่ ก่อนกลับมาพักที่พาโร';
  }
  if (title.includes('haa')) {
    return 'วันนี้เดินทางจากพาโรสู่ Haa Valley เที่ยวชมธรรมชาติและวิถีท้องถิ่น ก่อนเดินทางกลับมาพักที่พาโรในช่วงเย็น';
  }

  const isArrival = title.includes('bangkok') && title.indexOf('bangkok') < title.indexOf('paro');
  if (isArrival) {
    return 'เดินทางถึงสนามบินนานาชาติพาโร เริ่มเที่ยวสถานที่สำคัญในเมืองพาโร ก่อนเดินทางต่อสู่ทิมพู เมืองหลวงของภูฏาน และเข้าพักค้างคืน';
  }

  const isDeparture = title.includes('bangkok') && title.indexOf('paro') < title.indexOf('bangkok');
  if (isDeparture) {
    return 'เช้าวันสุดท้าย เที่ยวชมพาโรตามเวลาที่เหมาะสม ก่อนเดินทางสู่สนามบินนานาชาติพาโรเพื่อเดินทางกลับกรุงเทพฯ';
  }

  const thimphuToPunakha = title.includes('thimphu') && title.includes('punakha') && title.indexOf('thimphu') < title.indexOf('punakha');
  if (thimphuToPunakha) {
    return 'ออกเดินทางจากทิมพูสู่พูนาคา แวะ Dochula Pass ระหว่างทาง ก่อนเข้าสู่อดีตเมืองหลวงของภูฏาน เที่ยวชมวัดและสถานที่สำคัญในหุบเขาพูนาคา';
  }

  if (title.includes('punakha') && title.includes('paro')) {
    return 'ออกจากพูนาคา เดินทางกลับผ่านทิมพู แวะสถานที่สำคัญระหว่างทาง ก่อนเดินทางต่อสู่พาโรและเข้าพักค้างคืน';
  }

  if (title.includes('gangtey') || title.includes('phobjikha')) {
    return 'เดินทางสู่กังเตและหุบเขาโฟบจิกา เที่ยวชมอารามและธรรมชาติของหุบเขา ก่อนพักผ่อนท่ามกลางบรรยากาศเงียบสงบ';
  }

  return 'เดินทางตามโปรแกรมที่จัดไว้ให้เหมาะกับระยะทางและเวลา พร้อมเที่ยวชมสถานที่สำคัญของแต่ละเมืองอย่างเต็มที่';
}
