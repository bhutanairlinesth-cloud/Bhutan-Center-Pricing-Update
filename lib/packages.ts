export type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
};

export type TourPackage = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  days: number;
  nights: number;
  badge: string;
  audience: string;
  shortDescription: string;
  overview: string;
  cities: string[];
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: ItineraryDay[];
  priceFrom: number;
  priceNote: string;
  airline: string;
  hotel: string;
  image: string;
  accentImage: string;
  isActive: boolean;
};

const COMMON_INCLUDES = [
  "ที่พักมาตรฐานตามโปรแกรม พัก 2 ท่านต่อห้อง",
  "ตั๋วเครื่องบินชั้นประหยัดตามเงื่อนไขแพ็กเกจ",
  "วีซ่าภูฏานและ Sustainable Development Fee (SDF)",
  "ไกด์ท้องถิ่นภาษาอังกฤษและรถนำเที่ยวส่วนตัว",
  "อาหารตามรายการ",
  "ค่าเข้าชมสถานที่ท่องเที่ยวตามโปรแกรม",
];

const COMMON_EXCLUDES = [
  "ค่าจัดทำหนังสือเดินทาง",
  "ภาษีมูลค่าเพิ่ม 7% และภาษีหัก ณ ที่จ่าย (ถ้ามี)",
  "ค่าใช้จ่ายส่วนตัวและบริการที่ไม่ได้ระบุในโปรแกรม",
  "ค่าน้ำหนักกระเป๋าเกินกว่าที่สายการบินกำหนด",
  "ค่า Hot Stone Bath และกิจกรรมเสริม",
  "ค่าทิปไกด์และคนขับรถท้องถิ่น",
];

export const fallbackPackages: TourPackage[] = [
  {
    id: "journey-4d3n",
    slug: "journey-to-bhutan",
    name: "Journey to Bhutan",
    duration: "4 Days / 3 Nights",
    days: 4,
    nights: 3,
    badge: "แพ็กเกจยอดนิยม",
    audience: "เหมาะสำหรับผู้เดินทางครั้งแรก",
    shortDescription: "สัมผัสเสน่ห์ภูฏานแบบกระชับ พาโร–ทิมพู–พูนาคา พร้อมพิชิตวัดทักซัง",
    overview:
      "เที่ยวภูฏาน 4 วัน 3 คืน ดื่มด่ำบรรยากาศแห่งขุนเขาหิมาลัย สัมผัสวิถีชีวิตเรียบง่าย เยือนเมืองทิมพู พูนาคา และพาโร ชมศิลปวัฒนธรรม ธรรมชาติ และวัดทักซัง จุดหมายในฝันกลางหน้าผาสูง",
    cities: ["Paro", "Thimphu", "Punakha"],
    highlights: [
      "พิชิตวัดทักซัง (Tiger’s Nest)",
      "ชมป้อมปราการพูนาคาและสะพานแขวน",
      "เยือนทิมพู เมืองหลวงของภูฏาน",
      "เที่ยวแบบ Private Tour เลือกวันเดินทางได้",
    ],
    includes: COMMON_INCLUDES,
    excludes: COMMON_EXCLUDES,
    itinerary: [
      {
        day: 1,
        title: "Bangkok – Paro – Thimphu",
        summary:
          "เดินทางถึงพาโร พบไกด์ท้องถิ่น แวะ Tamchoe Monastery และจุดสำคัญระหว่างทาง ก่อนเที่ยว Memorial Chorten และ Tashichho Dzong ในเมืองทิมพู",
      },
      {
        day: 2,
        title: "Thimphu – Punakha – Thimphu",
        summary:
          "เดินทางผ่าน Dochula Pass สู่พูนาคา เยือน Chimi Lhakhang, Punakha Dzong และสะพานแขวน ก่อนกลับทิมพู",
      },
      {
        day: 3,
        title: "Thimphu – Paro – Taktsang",
        summary:
          "เดินทางสู่พาโรและขึ้นวัดทักซัง ไฮไลต์สำคัญของภูฏาน รับประทานอาหารระหว่างเส้นทางและพักผ่อนในเมืองพาโร",
      },
      {
        day: 4,
        title: "Paro – Bangkok",
        summary:
          "ชม National Museum, Paro Dzong และ Kyichu Lhakhang ก่อนเดินทางสู่สนามบินพาโรเพื่อกลับกรุงเทพฯ",
      },
    ],
    priceFrom: 59000,
    priceNote: "ราคาเริ่มต้นต่อท่าน สำหรับการเดินทางตามเงื่อนไขที่กำหนด",
    airline: "Bhutan Airlines",
    hotel: "Tourist Class / 3-star equivalent",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Paro_Taktsang%2C_Taktsang_Palphug_Monastery%2C_Tiger%27s_Nest_-views_from_the_trekking_path-_during_LGFC_-_Bhutan_2019_%28210%29.jpg",
    accentImage:
      "https://upload.wikimedia.org/wikipedia/commons/5/58/Punakha_dzong.jpg",
    isActive: true,
  },
  {
    id: "wonders-5d4n",
    slug: "wonders-of-bhutan",
    name: "Wonders of Bhutan",
    duration: "5 Days / 4 Nights",
    days: 5,
    nights: 4,
    badge: "แพ็กเกจขายดี",
    audience: "เหมาะสำหรับครอบครัวและผู้ที่อยากเที่ยวครบกำลังดี",
    shortDescription: "เที่ยวพาโร–ทิมพู–พูนาคาแบบเต็มอิ่ม พร้อมวัดทักซังและสถานที่สำคัญของภูฏาน",
    overview:
      "ทัวร์ภูฏาน 5 วัน 4 คืน เต็มไปด้วยประสบการณ์ด้านวัฒนธรรม ธรรมชาติ และวิถีชีวิตท้องถิ่น ชมเมืองสำคัญทั้งพาโร ทิมพู และพูนาคา พร้อมวันเต็มสำหรับวัดทักซัง",
    cities: ["Paro", "Thimphu", "Punakha"],
    highlights: [
      "เที่ยวพาโร ทิมพู และพูนาคาแบบไม่เร่งเกินไป",
      "เยือน Punakha Dzong และ Dochula Pass",
      "วันเต็มสำหรับการเดินขึ้นวัดทักซัง",
      "Private Tour ปรับโปรแกรมและวันเดินทางได้",
    ],
    includes: COMMON_INCLUDES,
    excludes: COMMON_EXCLUDES,
    itinerary: [
      {
        day: 1,
        title: "Bangkok – Paro – Thimphu",
        summary:
          "บินสู่พาโร เที่ยว Paro Dzong, National Museum และ Kyichu Lhakhang ก่อนเดินทางไปทิมพู ชมไปรษณีย์และ Tashichho Dzong",
      },
      {
        day: 2,
        title: "Thimphu – Punakha",
        summary:
          "เริ่มจาก Memorial Chorten เดินทางผ่าน Dochula Pass และสถูป 108 องค์ สู่พูนาคา เยือน Chimi Lhakhang และ Punakha Dzong",
      },
      {
        day: 3,
        title: "Punakha – Thimphu – Paro",
        summary:
          "กลับทิมพู ชมพระใหญ่ จุดชมวิว และ Takin Preserve ก่อนเดินทางต่อสู่เมืองพาโร",
      },
      {
        day: 4,
        title: "Paro – Taktsang",
        summary:
          "เดินขึ้นวัดทักซัง (Tiger’s Nest) จุดหมายสำคัญที่สุดแห่งหนึ่งของภูฏาน ใช้เวลาทั้งวันอย่างไม่เร่งรีบ",
      },
      {
        day: 5,
        title: "Paro – Bangkok",
        summary:
          "ชม Kyichu Lhakhang และเลือกซื้อของที่ระลึกในพาโร ก่อนเดินทางกลับกรุงเทพฯ โดย Bhutan Airlines",
      },
    ],
    priceFrom: 66500,
    priceNote: "ราคาเริ่มต้นต่อท่าน ราคาอาจเปลี่ยนตามวันเดินทาง จำนวนผู้เดินทาง และราคาตั๋ว",
    airline: "Bhutan Airlines",
    hotel: "Tourist Class / 3-star equivalent",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/58/Punakha_dzong.jpg",
    accentImage:
      "https://upload.wikimedia.org/wikipedia/commons/7/76/Tashichho_Dzong%2C_Bhutan_19.jpg",
    isActive: true,
  },
  {
    id: "ultimate-6d5n",
    slug: "the-ultimate-bhutan",
    name: "The Ultimate Bhutan",
    duration: "6 Days / 5 Nights",
    days: 6,
    nights: 5,
    badge: "เที่ยวครบที่สุด",
    audience: "เหมาะสำหรับผู้ที่อยากสัมผัสภูฏานให้ลึกขึ้น",
    shortDescription: "เพิ่ม Gangtey เข้ามาในเส้นทาง เที่ยวธรรมชาติและวัฒนธรรมแบบเต็มประสบการณ์",
    overview:
      "เที่ยวภูฏาน 6 วัน 5 คืน ดื่มด่ำเสน่ห์ธรรมชาติ ศรัทธา และวัฒนธรรมอย่างลึกซึ้ง เยือนทิมพู พูนาคา พาโร และกังเต พร้อมวัดวาอาราม ป้อมปราการ และภูมิประเทศแห่งหิมาลัย",
    cities: ["Paro", "Thimphu", "Punakha", "Gangtey"],
    highlights: [
      "เพิ่มเส้นทาง Gangtey และธรรมชาติในหุบเขา",
      "เที่ยวเมืองสำคัญของภูฏานครบยิ่งขึ้น",
      "ชม Punakha Dzong และวัดทักซัง",
      "เหมาะกับทริปส่วนตัวที่มีเวลามากขึ้น",
    ],
    includes: COMMON_INCLUDES,
    excludes: COMMON_EXCLUDES,
    itinerary: [
      { day: 1, title: "Bangkok – Paro – Thimphu", summary: "เดินทางด้วย Bhutan Airlines สู่พาโร ก่อนเข้าทิมพูและเที่ยวสถานที่สำคัญในเมืองหลวง" },
      { day: 2, title: "Thimphu – Punakha", summary: "เดินทางผ่าน Dochula Pass สู่พูนาคา เที่ยววัดและป้อมปราการสำคัญ" },
      { day: 3, title: "Punakha – Gangtey – Punakha", summary: "ออกไปสัมผัสธรรมชาติและวัฒนธรรมของหุบเขากังเต ก่อนกลับพักพูนาคา" },
      { day: 4, title: "Punakha – Thimphu – Paro", summary: "เดินทางกลับผ่านทิมพูและต่อสู่พาโร พร้อมแวะจุดสำคัญระหว่างทาง" },
      { day: 5, title: "Paro – Taktsang", summary: "วันเต็มสำหรับวัดทักซัง เดินเขา ชมทิวทัศน์ และสัมผัสสถานที่ศักดิ์สิทธิ์ของภูฏาน" },
      { day: 6, title: "Paro – Bangkok", summary: "เที่ยวพาโรช่วงเช้าและเดินทางสู่สนามบินเพื่อกลับกรุงเทพฯ" },
    ],
    priceFrom: 73000,
    priceNote: "ราคาเริ่มต้นต่อท่าน ราคาอาจเปลี่ยนตามวันเดินทาง จำนวนผู้เดินทาง และราคาตั๋ว",
    airline: "Bhutan Airlines",
    hotel: "Tourist Class / 3-star equivalent",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/76/Tashichho_Dzong%2C_Bhutan_19.jpg",
    accentImage:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Paro_Taktsang%2C_Taktsang_Palphug_Monastery%2C_Tiger%27s_Nest_-views_from_the_trekking_path-_during_LGFC_-_Bhutan_2019_%28210%29.jpg",
    isActive: true,
  },
];

export function formatTHB(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}
