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
    story: 'การเดินทางเริ่มต้นที่พาโร เมืองในหุบเขาที่เป็นประตูทางอากาศของภูฏาน หลังผ่านพิธีการตรวจคนเข้าเมือง เราจะพบไกด์ท้องถิ่นและเริ่มทำความรู้จักประเทศนี้อย่างค่อยเป็นค่อยไป ก่อนเดินทางต่อสู่ทิมพู',
    image: commons('Bhutan Airlines Airbus A319 (A5-BAC) at Paro Airport.jpg'),
  },
  {
    key: 'rinpung',
    title: 'Rinpung Dzong',
    eyebrow: 'PARO · FORTRESS & MONASTERY',
    story: 'Rinpung Dzong คือหนึ่งในสัญลักษณ์สำคัญของพาโร ป้อม–อารามขนาดใหญ่ที่สะท้อนความสัมพันธ์ระหว่างศาสนา การบริหาร และสถาปัตยกรรมดั้งเดิมของภูฏานได้ชัดเจน',
    image: commons('Rinpung Dzong, Paro, Bhutan.jpg'),
  },
  {
    key: 'national-museum',
    title: 'National Museum',
    eyebrow: 'PARO · TA DZONG',
    story: 'Ta Dzong ซึ่งเคยทำหน้าที่เป็นหอเฝ้าระวัง ปัจจุบันเป็นพิพิธภัณฑสถานแห่งชาติ จุดนี้ช่วยให้เราเห็นภาพรวมของประวัติศาสตร์ ศิลปะ และวิถีชีวิต ก่อนออกเดินทางไปยังเมืองถัดไป',
    image: commons('National Museum of Bhutan 01.jpg'),
  },
  {
    key: 'buddha',
    title: 'Buddha Dordenma',
    eyebrow: 'THIMPHU · ABOVE THE CAPITAL',
    story: 'พระพุทธรูปขนาดใหญ่เหนือหุบเขาทิมพูเป็นหนึ่งในจุดชมวิวที่ทำให้เห็นเมืองหลวงในภาพกว้าง พร้อมสัมผัสบรรยากาศของศรัทธาที่อยู่คู่กับชีวิตร่วมสมัยของเมือง',
    image: commons('Thimphu-Buddha Dordenma-02-2015-gje.jpg'),
  },
  {
    key: 'takin',
    title: 'Motithang Takin Preserve',
    eyebrow: 'THIMPHU · NATIONAL ANIMAL',
    story: 'ก่อนออกจากทิมพู เราจะได้พบ “ทาคิน” สัตว์ประจำชาติของภูฏาน อีกหนึ่งรายละเอียดเล็ก ๆ ที่ทำให้การเดินทางไม่ได้มีเพียงวัดและภูเขา แต่ยังเชื่อมโยงกับธรรมชาติของประเทศด้วย',
    image: commons('Takins at Motithang Takin Preserve, Bhutan.jpg'),
  },
  {
    key: 'dochula',
    title: 'Dochula Pass',
    eyebrow: 'BETWEEN THIMPHU & PUNAKHA',
    story: 'เส้นทางจากทิมพูสู่พูนาคาค่อย ๆ ไต่ระดับขึ้นสู่ Dochula Pass ที่มีเจดีย์ Druk Wangyal 108 องค์เรียงตัวบนสันเขา และในวันที่อากาศเปิดสามารถมองเห็นแนวเทือกเขาหิมาลัยได้จากจุดนี้',
    image: commons('Some of 108 chortens, Dochula pass.jpg'),
  },
  {
    key: 'chimi',
    title: 'Chimi Lhakhang',
    eyebrow: 'PUNAKHA · LOCAL FAITH & STORIES',
    story: 'Chimi Lhakhang เป็นวัดเล็กกลางหุบเขาที่มีเรื่องเล่าเฉพาะตัวเกี่ยวกับ Drukpa Kunley หรือ Divine Madman ทำให้ช่วงนี้ของทริปมีทั้งมิติทางศาสนา เรื่องเล่า และวิถีชุมชน',
    image: commons('Chimi Lhakhang, Bhutan 01.jpg'),
  },
  {
    key: 'punakha-dzong',
    title: 'Punakha Dzong',
    eyebrow: 'PUNAKHA · THE OLD CAPITAL',
    story: 'พูนาคาเคยเป็นเมืองหลวงของภูฏาน และ Punakha Dzong คือหัวใจของเรื่องราวนั้น ป้อมขนาดใหญ่ตั้งอยู่ตรงจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu และยังคงเป็นหนึ่งในสถานที่สำคัญที่สุดของประเทศ',
    image: commons('Punakha dzong.jpg'),
  },
  {
    key: 'punakha-bridge',
    title: 'Punakha Suspension Bridge',
    eyebrow: 'PUNAKHA · ACROSS THE RIVER',
    story: 'หลังชมซอง เราจะเปลี่ยนจังหวะมาเดินบนสะพานแขวนเหนือสายน้ำ ท่ามกลางธงมนต์และทิวทัศน์หุบเขา เป็นช่วงที่ได้สัมผัสภูฏานในมุมที่เบาและเป็นธรรมชาติมากขึ้น',
    image: commons('Punakha 3-69, suspension bridge.jpg'),
  },
  {
    key: 'simtokha',
    title: 'Simtokha Dzong',
    eyebrow: 'RETURNING WEST · HISTORIC DZONG',
    story: 'ระหว่างเดินทางกลับจากฝั่งพูนาคา เราจะแวะ Simtokha Dzong หนึ่งในซองเก่าแก่ของภูฏาน เป็นจุดเชื่อมจากเมืองหลวงกลับสู่หุบเขาพาโร ก่อนเข้าสู่ช่วงท้ายของทริป',
    image: commons('Simtokha Dzong, Bhutan 01.jpg'),
  },
  {
    key: 'paro-valley',
    title: 'Back to Paro Valley',
    eyebrow: 'PARO · THE FINAL CHAPTER',
    story: 'เมื่อกลับเข้าสู่พาโร บรรยากาศของทริปจะเริ่มช้าลงอีกครั้ง เมืองในหุบเขาแห่งนี้ถูกวางไว้เป็นฐานของคืนสุดท้าย เพื่อให้วันสำคัญก่อนกลับและการเดินทางสู่สนามบินเป็นไปอย่างสบายที่สุด',
    image: commons('The view of PARO Valley, Bhutan from above (34225469743).jpg'),
  },
  {
    key: 'taktsang',
    title: 'Taktsang · Tiger’s Nest',
    eyebrow: 'PARO · THE ICONIC HIGHLIGHT',
    story: 'วันก่อนเดินทางกลับถูกเก็บไว้สำหรับ Taktsang หรือ Tiger’s Nest วัดที่เกาะอยู่บนหน้าผาเหนือหุบเขาพาโร เราจะใช้เวลาวันนี้กับเส้นทางเดินเขาอย่างเต็มที่ ไม่เร่ง และกลับมาพักที่พาโรในช่วงเย็น',
    image: commons('Bhutan-Paro-116-Taktshang-Tigernest-gje.jpg'),
  },
  {
    key: 'taktsang-trail',
    title: 'The Trail to Tiger’s Nest',
    eyebrow: 'TAKTSANG · THE JOURNEY IS PART OF THE STORY',
    story: 'เสน่ห์ของวันนี้ไม่ได้อยู่เฉพาะปลายทาง ระหว่างทางเราจะเดินผ่านป่าสน จุดพัก และ Taktsang Cafeteria ก่อนค่อย ๆ เข้าใกล้วัดบนหน้าผา ประสบการณ์ตลอดเส้นทางคือส่วนสำคัญของความทรงจำวันนี้',
    image: commons('On the way to Paro Taktsang - The Tiger Nest (14).jpg'),
  },
  {
    key: 'kyichu',
    title: 'Kyichu Lhakhang',
    eyebrow: 'PARO · A QUIET FAREWELL',
    story: 'เช้าวันสุดท้ายเริ่มด้วยความสงบที่ Kyichu Lhakhang วัดเก่าแก่ในหุบเขาพาโร ก่อนใช้เวลาที่เหลืออย่างสบาย ๆ และเดินทางสู่สนามบินนานาชาติพาโรเพื่อกลับกรุงเทพฯ',
    image: commons('Bouthan-Paro-temple kyichu lhakhang.JPG'),
  },
  {
    key: 'paro-town',
    title: 'A Final Glimpse of Paro',
    eyebrow: 'PARO · BEFORE DEPARTURE',
    story: 'ช่วงสุดท้ายของทริปเป็นเวลาสำหรับเก็บบรรยากาศเมืองพาโรและเลือกซื้อของที่ระลึกตามอัธยาศัย ก่อนปิดการเดินทางด้วยเส้นทางสั้น ๆ สู่สนามบิน',
    image: commons('View of Paro from Tenchen Gonpa.jpg'),
  },
  {
    key: 'gangtey-monastery',
    title: 'Gangtey Monastery',
    eyebrow: 'GANGTEY · ABOVE PHOBJIKHA',
    story: 'Gangtey Monastery ตั้งอยู่เหนือหุบเขาโฟบจิกาและเป็นศูนย์กลางทางศาสนาที่สำคัญของพื้นที่ จากบริเวณอารามเราจะเริ่มเห็นภูมิประเทศเปิดกว้างที่ทำให้กังเตแตกต่างจากเมืองหลักอย่างชัดเจน',
    image: commons('Gangtey Gompa Bhutan.jpg'),
  },
  {
    key: 'phobjikha',
    title: 'Phobjikha Valley',
    eyebrow: 'PHOBJIKHA · THE QUIET VALLEY',
    story: 'หุบเขาโฟบจิกาให้จังหวะการเดินทางที่ช้าลง ทั้งทุ่งหญ้า ป่าสน และพื้นที่ชุ่มน้ำกว้าง ทำให้วันนี้เป็นช่วงที่ใกล้ธรรมชาติและเงียบสงบที่สุดของทริป',
    image: commons('Phobjikha valley.jpg'),
  },
  {
    key: 'haa',
    title: 'Haa Valley',
    eyebrow: 'HAA · A QUIETER ALTERNATIVE',
    story: 'หากเลือก Haa แทนการขึ้นทักซัง เราจะออกจากพาโรสู่หุบเขาที่เงียบกว่า ใช้เวลาอยู่กับภูมิประเทศและวิถีท้องถิ่น ก่อนเดินทางกลับมาพักที่พาโรในคืนสุดท้ายเช่นเดิม',
    image: commons('Haa valley, Ha - during LGFC - Bhutan 2019 (1).jpg'),
  },
  {
    key: 'haa-detail',
    title: 'Across Haa Valley',
    eyebrow: 'HAA · LANDSCAPE & LOCAL LIFE',
    story: 'เส้นทาง Haa ให้ภาพภูฏานอีกแบบหนึ่ง—พื้นที่เปิดกว้าง หมู่บ้านเล็ก และภูเขาที่โอบล้อมหุบเขา เหมาะสำหรับผู้ที่อยากใช้วันสุดท้ายก่อนกลับในจังหวะที่สงบกว่า',
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
    return 'วันนี้คือไฮไลต์สำคัญของการเดินทาง เราจะใช้เวลาอย่างเต็มที่กับเส้นทางเดินขึ้น Taktsang หรือ Tiger’s Nest โดยไม่เร่งรีบ และกลับมาพักที่พาโรในคืนสุดท้ายก่อนเดินทางกลับ';
  }
  if (title.includes('haa')) {
    return 'วันนี้เราเลือกเส้นทางที่สงบกว่าแทนการขึ้นทักซัง เดินทางจากพาโรสู่ Haa Valley ใช้เวลากับภูมิประเทศและวิถีท้องถิ่น ก่อนกลับมาพักที่พาโรในช่วงเย็น';
  }

  const isArrival = title.includes('bangkok') && title.indexOf('bangkok') < title.indexOf('paro');
  if (isArrival) {
    return 'เริ่มต้นที่สนามบินนานาชาติพาโร ทำความรู้จักหุบเขาพาโรผ่านสถานที่สำคัญ แล้วค่อยเดินทางต่อสู่ทิมพู เมืองหลวงปัจจุบันของภูฏาน เพื่อพักค้างคืนและเริ่มเข้าสู่จังหวะของประเทศอย่างแท้จริง';
  }

  const isDeparture = title.includes('bangkok') && title.indexOf('paro') < title.indexOf('bangkok');
  if (isDeparture) {
    return 'เช้าวันสุดท้ายยังมีเวลาให้เราเก็บบรรยากาศของพาโรอีกเล็กน้อย ก่อนเดินทางสู่สนามบินนานาชาติพาโรและบินกลับกรุงเทพฯ โดยปิดทริปอย่างสบาย ไม่เร่งรีบ';
  }

  const thimphuToPunakha = title.includes('thimphu') && title.includes('punakha') && title.indexOf('thimphu') < title.indexOf('punakha');
  if (thimphuToPunakha) {
    return 'ออกจากทิมพูมุ่งหน้าสู่พูนาคา เส้นทางวันนี้ค่อย ๆ ไต่ขึ้นสู่ Dochula Pass ก่อนลดระดับลงสู่หุบเขาที่อบอุ่นกว่า และเข้าสู่อดีตเมืองหลวงซึ่งมี Punakha Dzong เป็นหัวใจสำคัญของเมือง';
  }

  if (title.includes('punakha') && title.includes('paro')) {
    return 'หลังใช้เวลาอยู่ในพูนาคา เราจะเริ่มเดินทางกลับทางตะวันตก ผ่านทิมพูและจุดสำคัญระหว่างทาง ก่อนกลับเข้าสู่หุบเขาพาโร เพื่อพักค้างคืนและเตรียมเข้าสู่ช่วงท้ายของการเดินทาง';
  }

  if (title.includes('gangtey') || title.includes('phobjikha')) {
    return 'เส้นทางวันนี้พาเราออกจากเมืองหลักเข้าสู่กังเตและหุบเขาโฟบจิกา พื้นที่ที่เงียบกว่า เปิดกว้างกว่า และทำให้จังหวะของทริปช้าลงอย่างชัดเจน';
  }

  return 'วันนี้เราเดินทางต่อโดยจัดลำดับสถานที่ให้สอดคล้องกับระยะทางและเวลา เพื่อให้ได้สัมผัสแต่ละพื้นที่อย่างเต็มที่โดยไม่ต้องเร่งจากจุดหนึ่งไปอีกจุดหนึ่ง';
}
