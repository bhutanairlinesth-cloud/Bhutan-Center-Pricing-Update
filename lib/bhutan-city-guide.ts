import { siteImages } from "./site-images";

export type BhutanCitySlug = "paro" | "thimphu" | "punakha" | "gangtey-phobjikha";

type Attraction = {
  name: string;
  subtitle: string;
  description: string;
};

export type BhutanCityGuide = {
  slug: BhutanCitySlug;
  mapLabel: string;
  en: string;
  th: string;
  eyebrow: string;
  hero: string;
  status: string;
  population2025: number;
  populationLabel: string;
  summary: string;
  history: string;
  mood: string;
  recommendedStay: string;
  bestFor: string[];
  attractions: Attraction[];
  mapPosition: { left: string; top: string };
};

export const bhutanCityGuides: BhutanCityGuide[] = [
  {
    slug: "paro",
    mapLabel: "Paro",
    en: "Paro",
    th: "พาโร",
    eyebrow: "THE GATEWAY TO BHUTAN",
    hero: siteImages.tigerNest,
    status: "ประตูสู่ภูฏานและที่ตั้งสนามบินนานาชาติ",
    population2025: 53899,
    populationLabel: "Paro Dzongkhag",
    summary: "เมืองในหุบเขาที่รวมแลนด์มาร์กสำคัญของภูฏานไว้มากที่สุดแห่งหนึ่ง ตั้งแต่วัดทักซังบนหน้าผา ไปจนถึง Rinpung Dzong และพิพิธภัณฑสถานแห่งชาติ",
    history: "พาโรเป็นศูนย์กลางสำคัญทางประวัติศาสตร์และศาสนาของภูฏานตะวันตก Rinpung Dzong ทำหน้าที่ทั้งด้านศาสนาและการบริหารของเขตพาโร ขณะที่ Ta Dzong ซึ่งสร้างเป็นหอเฝ้าระวังในคริสต์ศตวรรษที่ 17 ปัจจุบันเป็นพิพิธภัณฑสถานแห่งชาติ เมืองนี้ยังเป็นประตูอากาศหลักของประเทศผ่านสนามบินนานาชาติพาโร",
    mood: "ภูเขา · ศรัทธา · เมืองเก่า",
    recommendedStay: "1–2 คืน",
    bestFor: ["คนไปภูฏานครั้งแรก", "คนอยากพิชิต Tiger’s Nest", "คนชอบวัดและสถาปัตยกรรมดั้งเดิม"],
    attractions: [
      { name: "Tiger’s Nest (Paro Taktsang)", subtitle: "แลนด์มาร์กที่ต้องเห็นด้วยตาตัวเอง", description: "วัดบนหน้าผาเหนือหุบเขาพาโร หนึ่งในภาพจำสำคัญที่สุดของภูฏานและเป็นวันเดินเขาหลักของหลายโปรแกรม" },
      { name: "Rinpung Dzong", subtitle: "Fortress on a Heap of Jewels", description: "ป้อม–อารามขนาดใหญ่ริมแม่น้ำพาโร เป็นทั้งศูนย์กลางศาสนาและที่ทำการบริหารของเขต" },
      { name: "National Museum (Ta Dzong)", subtitle: "เรื่องราวภูฏานในหอเฝ้าระวังเก่า", description: "อาคาร Ta Dzong เหนือ Rinpung Dzong ได้รับการปรับเป็นพิพิธภัณฑสถานแห่งชาติและรวบรวมศิลปวัฒนธรรมภูฏาน" },
      { name: "Kyichu Lhakhang", subtitle: "วัดเก่าแก่ในหุบเขาพาโร", description: "วัดสำคัญที่ให้บรรยากาศสงบ เหมาะสำหรับสัมผัสด้านศรัทธาของภูฏานแบบไม่เร่งรีบ" },
    ],
    mapPosition: { left: "19%", top: "55%" },
  },
  {
    slug: "thimphu",
    mapLabel: "Thimphu",
    en: "Thimphu",
    th: "ทิมพู",
    eyebrow: "THE CAPITAL",
    hero: siteImages.thimphuDzong,
    status: "เมืองหลวงและศูนย์กลางการปกครอง",
    population2025: 171095,
    populationLabel: "Thimphu Dzongkhag",
    summary: "เมืองหลวงที่ทำให้เห็นว่าภูฏานไม่ได้มีแค่วัดและภูเขา แต่ยังมีชีวิตร่วมสมัย งานศิลป์ ร้านกาแฟ พิพิธภัณฑ์ และสถานที่สำคัญของประเทศ",
    history: "ทิมพูเป็นหัวใจด้านการบริหารและวัฒนธรรมของภูฏาน Tashichho Dzong บนฝั่งแม่น้ำ Wang Chhu เป็นที่ตั้งของห้องพระราชบัลลังก์และหน่วยงานสำคัญของรัฐ รูปลักษณ์ปัจจุบันของป้อมได้รับการพัฒนาอย่างมากในช่วงทศวรรษ 1960 เมืองนี้จึงสะท้อนการอยู่ร่วมกันของความทันสมัยกับสถาบันทางศาสนาได้ชัดเจน",
    mood: "เมืองหลวง · วัฒนธรรม · ชีวิตร่วมสมัย",
    recommendedStay: "1–2 คืน",
    bestFor: ["คนชอบวัฒนธรรมและพิพิธภัณฑ์", "คนอยากเห็นชีวิตประจำวันของคนภูฏาน", "คนเดินทางช่วงเทศกาล Thimphu Tshechu"],
    attractions: [
      { name: "Tashichho Dzong", subtitle: "ศูนย์กลางการปกครองและศาสนา", description: "ป้อมสีขาวหลังคาทองริมแม่น้ำ เป็นหนึ่งในสัญลักษณ์สำคัญของเมืองหลวงและสถานที่จัด Thimphu Tshechu" },
      { name: "Buddha Dordenma", subtitle: "พระพุทธรูปใหญ่เหนือหุบเขาทิมพู", description: "พระพุทธรูปสำริดปิดทองสูง 54 เมตร ตั้งอยู่บนเนินเหนือเมือง มองเห็นวิวหุบเขาทิมพูแบบกว้าง" },
      { name: "National Memorial Chorten", subtitle: "จังหวะศรัทธากลางเมือง", description: "สถานที่ที่เห็นผู้คนท้องถิ่นเดินเวียน สวดมนต์ และหมุนกงล้อธรรม เป็นอีกมุมที่ทำให้รู้จักภูฏานผ่านชีวิตจริง" },
      { name: "National Textile Museum", subtitle: "เข้าใจภูฏานผ่านผืนผ้า", description: "เรียนรู้ลายผ้า เครื่องแต่งกาย และเทคนิคการทอที่เป็นส่วนสำคัญของอัตลักษณ์ภูฏาน" },
    ],
    mapPosition: { left: "29%", top: "48%" },
  },
  {
    slug: "punakha",
    mapLabel: "Punakha",
    en: "Punakha",
    th: "พูนาคา",
    eyebrow: "THE OLD CAPITAL",
    hero: siteImages.punakhaDzong,
    status: "อดีตเมืองหลวงและที่ประทับฤดูหนาวของคณะสงฆ์กลาง",
    population2025: 32116,
    populationLabel: "Punakha Dzongkhag",
    summary: "หุบเขาอากาศอบอุ่นที่มี Punakha Dzong ตั้งเด่นตรงจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu ให้ภาพภูฏานอีกแบบที่เขียว อบอุ่น และโรแมนติกกว่าเมืองบนที่สูง",
    history: "พูนาคาเคยทำหน้าที่เป็นเมืองหลวงฤดูหนาวของภูฏานจนถึงปี 1955 และยังคงเป็นที่พำนักฤดูหนาวของคณะสงฆ์กลาง Punakha Dzong สร้างขึ้นในปี 1637 และเป็นสถานที่สำคัญของประวัติศาสตร์ชาติ รวมถึงพระราชพิธีของราชวงศ์หลายวาระ",
    mood: "แม่น้ำ · หุบเขา · ประวัติศาสตร์",
    recommendedStay: "1–2 คืน",
    bestFor: ["คู่รักและคนชอบถ่ายภาพ", "คนอยากได้อากาศอบอุ่นกว่าทิมพู", "คนชอบประวัติศาสตร์และวิวแม่น้ำ"],
    attractions: [
      { name: "Punakha Dzong", subtitle: "The Palace of Great Bliss", description: "ป้อมสำคัญของภูฏานที่ตั้งอยู่ตรงจุดบรรจบของแม่น้ำสองสาย และเป็นหนึ่งในภาพที่สวยที่สุดของประเทศ" },
      { name: "Punakha Suspension Bridge", subtitle: "สะพานแขวนเหนือ Po Chhu", description: "จุดเดินเล่นและถ่ายภาพวิวหุบเขา แม่น้ำ และธงมนต์ เหมาะกับการเที่ยวต่อจาก Punakha Dzong" },
      { name: "Chimi Lhakhang", subtitle: "วัดแห่ง Divine Madman", description: "วัดที่มีเรื่องเล่าเฉพาะตัวของภูฏานและเป็นสถานที่แสวงบุญที่มีชื่อเสียงของภูมิภาค" },
      { name: "Khamsum Yulley Namgyal Chorten", subtitle: "เจดีย์บนเนินเหนือทุ่งนา", description: "เหมาะกับคนที่อยากเดินเบา ๆ ผ่านชนบทและได้มุมมองเหนือหุบเขาพูนาคา" },
    ],
    mapPosition: { left: "39%", top: "40%" },
  },
  {
    slug: "gangtey-phobjikha",
    mapLabel: "Gangtey",
    en: "Gangtey / Phobjikha",
    th: "กังเต / โฟบจิกา",
    eyebrow: "THE QUIET VALLEY",
    hero: siteImages.phobjikhaValley,
    status: "หุบเขาธรรมชาติใน Wangdue Phodrang Dzongkhag",
    population2025: 48404,
    populationLabel: "Wangdue Phodrang Dzongkhag",
    summary: "พื้นที่สำหรับคนที่อยากเห็นภูฏานในจังหวะที่ช้าลง หุบเขากว้าง บ้านพื้นถิ่น ทางเดินธรรมชาติ และนกกระเรียนคอดำในฤดูหนาวทำให้ที่นี่ต่างจากเส้นทางเมืองหลักอย่างชัดเจน",
    history: "Phobjikha เป็นหุบเขาในเขต Wangdue Phodrang และเป็นพื้นที่ฤดูหนาวสำคัญของนกกระเรียนคอดำ Gangtey Monastery ตั้งอยู่เหนือหุบเขาและก่อตั้งขึ้นในปี 1613 โดยสายสืบทอดของ Pema Lingpa ความสัมพันธ์ระหว่างชุมชน ศาสนา และธรรมชาติทำให้พื้นที่นี้มีเอกลักษณ์มาก",
    mood: "ธรรมชาติ · ความสงบ · วิถีหุบเขา",
    recommendedStay: "1 คืน หรือเพิ่มในทริป 6 วัน",
    bestFor: ["คนรักธรรมชาติและการเดินเบา ๆ", "คนที่อยากพักจากเมือง", "คนเดินทางฤดูหนาวเพื่อดูนกกระเรียนคอดำ"],
    attractions: [
      { name: "Phobjikha Valley", subtitle: "หุบเขากว้างที่ทำให้เวลาเดินช้าลง", description: "ภูมิประเทศแบบชุ่มน้ำและทุ่งหญ้าท่ามกลางภูเขา ให้บรรยากาศสงบและเปิดกว้างต่างจากเมืองหลัก" },
      { name: "Gangtey Monastery", subtitle: "อารามเหนือหุบเขา", description: "อารามสำคัญของสาย Nyingma ที่มีประวัติย้อนไปถึงต้นคริสต์ศตวรรษที่ 17 และมองเห็นหุบเขาได้กว้าง" },
      { name: "Gangtey Nature Trail", subtitle: "เดินง่ายผ่านป่าสนและทุ่งหญ้า", description: "เส้นทางราว 4–5 กิโลเมตร เหมาะสำหรับสัมผัสธรรมชาติและหมู่บ้านในหุบเขาแบบไม่ต้องเดินเขาหนัก" },
      { name: "Black-necked Crane Centre", subtitle: "รู้จักแขกฤดูหนาวของหุบเขา", description: "จุดเรียนรู้และสังเกตนกกระเรียนคอดำซึ่งอพยพมาพักใน Phobjikha ช่วงฤดูหนาว" },
    ],
    mapPosition: { left: "50%", top: "54%" },
  },
];

export const bhutanCityGuideBySlug = Object.fromEntries(bhutanCityGuides.map((city) => [city.slug, city])) as Record<BhutanCitySlug, BhutanCityGuide>;

export function destinationPublicPath(slug: BhutanCitySlug) {
  return `/bhutan-attractions/${slug}`;
}
