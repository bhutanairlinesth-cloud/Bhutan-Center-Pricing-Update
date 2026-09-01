import type { Metadata } from "next";

export type SeoChecklistTasks = {
  title: boolean;
  description: boolean;
  alt: boolean;
  links: boolean;
};

export type SeoPage = {
  id: string;
  name: string;
  currentPath: string;
  legacyUrl?: string;
  title: string;
  description: string;
  focusKeywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  indexable: boolean;
  schemaType: "WebPage" | "TouristTrip" | "Article" | "Hotel" | "FAQPage";
  lockLegacyUrl: boolean;
  tasks: SeoChecklistTasks;
};

export type SeoRedirect = {
  id: string;
  from: string;
  to: string;
  type: 301 | 308;
  enabled: boolean;
};

export type SeoState = {
  site: {
    brandName: string;
    siteName: string;
    domain: string;
    keywords: string[];
    googleSearchConsoleConnected: boolean;
    customDomainConnected: boolean;
    homepageIndexing: boolean;
    mobileOptimized: boolean;
    sitemapEnabled: boolean;
    robotsEnabled: boolean;
    organizationSchemaEnabled: boolean;
    geoEnabled: boolean;
  };
  pages: SeoPage[];
  redirects: SeoRedirect[];
  updatedAt: string;
};

const incomplete = new Map<string, keyof SeoChecklistTasks>([
  ["TH 4วัน3คืน Journey to Bhutan", "links"],
  ["P-3 Paro Grand", "links"],
  ["ที่พักในภูฏาน", "alt"],
  ["TH 6วัน5คืน The Ultimate Bhutan", "links"],
  ["ตั๋วเครื่องบิน Bhutan Airlines", "alt"],
  ["Package bhutan", "links"],
  ["TH 5วัน4คืน Wonders of Bhutan", "links"],
  ["Green Season 2026", "links"],
]);

const knownLegacyUrls: Record<string, string> = {
  "หน้าหลัก": "/",
  "จองตั๋วไปภูฏานยังไง มีกี่สายการบิน?": "/airlines-of-bhutan",
  "EN 4วัน3คืน Journey to Bhutan": "/bhutan-journey-to-bhutan-3stars-en",
  "กรอกจองแพ็กเกจ": "/packagetours-bhutan-booking",
  "ความเป็นมาและความรื่นเริงระบำหน้ากากภูฏาน": "/bhutan-tshechu-story",
  "ติดต่อเรา": "/contact-us-bhutancenter",
  "ภูฏาน ประเทศที่มีความสุขที่สุดในโลก": "/land-happiness-bhutan",
  "4วัน3คืน Journey to Bhutan": "/bhutan-journey-to-bhutan-3stars",
  "Blog": "/blog-bhutancenter",
  "ภูฏาน ดินแดนธรรมชาติที่คาร์บอนไดออกไซด์": "/carbon-negative-bhutan",
  "สถานที่ท่องเที่ยว": "/bhutan-attractions",
  "ภูฏานมีกี่ฤดู ช่วงไหนน่าเที่ยวที่สุด?": "/season-of-bhutan",
  "ที่พักในภูฏาน": "/hotelbhutan",
  "แพ็กเกจภูฏาน": "/packagetour-bhutan-new",
  "วีซ่าภูฏาน": "/how-to-visabhutan",
  "วัฒนธรรมการกินที่ทุกมื้อต้องมี “พริก”": "/foods-of-bhutan",
  "7 สิ่งพิเศษแห่งภูฏานที่ไม่อาจลืม": "/7special-thing-of-bhutan",
  "TH 5วัน4คืน Wonders of Bhutan": "/th5d4n",
  "รู้ไว้ก่อนไปภูฏาน": "/justletyouknow-bhutan",
  "EN 5วัน4คืน Wonders of Bhutan": "/bhutan-wonders-of-bhutan-3stars-en",
  "Package bhutan": "/package-bhutan-en",
  "ซัมเมอร์นี้เที่ยวภูฏาน": "/summer-in-bhutan",
  "ค่าเหยียบแผ่นดินคืออะไร ทำไมต้องจ่าย?": "/the-sustainable-development-fee",
  "6วัน5คืน The Ultimate Bhutan": "/bhutan-the-ultimate-bhutan-3stars",
};

const currentPaths: Record<string, string> = {
  "หน้าหลัก": "/",
  "กรอกจองแพ็กเกจ": "/booking",
  "ติดต่อเรา": "/contact",
  "4วัน3คืน Journey to Bhutan": "/packages/journey-to-bhutan",
  "TH 5วัน4คืน Wonders of Bhutan": "/packages/wonders-of-bhutan",
  "6วัน5คืน The Ultimate Bhutan": "/packages/the-ultimate-bhutan",
  "สถานที่ท่องเที่ยว": "/destinations",
  "ที่พักในภูฏาน": "/hotels",
  "แพ็กเกจภูฏาน": "/packages",
  "วีซ่าภูฏาน": "/visa",
  "รู้ไว้ก่อนไปภูฏาน": "/travel-info",
  "ตั๋วเครื่องบิน Bhutan Airlines": "/bhutan-airlines",
  "Blog": "/journal",
};

const pageNames = [
  "หน้าหลัก",
  "จองตั๋วไปภูฏานยังไง มีกี่สายการบิน?",
  "EN 4วัน3คืน Journey to Bhutan",
  "กรอกจองแพ็กเกจ",
  "ความเป็นมาและความรื่นเริงระบำหน้ากากภูฏาน",
  "ติดต่อเรา",
  "ภูฏาน ประเทศที่มีความสุขที่สุดในโลก",
  "TH 4วัน3คืน Journey to Bhutan",
  "4วัน3คืน Journey to Bhutan",
  "P-3 Olathang",
  "Blog",
  "ภูฏาน ดินแดนธรรมชาติที่คาร์บอนไดออกไซด์",
  "T-5 Le Méridien Thimphu",
  "P-3 Paro Grand",
  "P-5 Le Méridien Paro Riverfront",
  "EN 6วัน5คืน The Ultimate Bhutan",
  "สถานที่ท่องเที่ยว",
  "ภูฏานมีกี่ฤดู ช่วงไหนน่าเที่ยวที่สุด?",
  "P-3 Aari Sangdrup",
  "ที่พักในภูฏาน",
  "T-3 Tashi yoedling",
  "แพ็กเกจภูฏาน",
  "TH 6วัน5คืน The Ultimate Bhutan",
  "วีซ่าภูฏาน",
  "กรอกจองแพ็กเกจสำหรับบริษัททัวร์",
  "ตั๋วเครื่องบิน Bhutan Airlines",
  "วัฒนธรรมการกินที่ทุกมื้อต้องมี “พริก”",
  "P-3 Olathang Cottages",
  "7 สิ่งพิเศษแห่งภูฏานที่ไม่อาจลืม",
  "TH 5วัน4คืน Wonders of Bhutan",
  "Pu-4 Zhingkham Resort",
  "ขั้นตอนการจองทัวร์ภูฏาน",
  "รู้ไว้ก่อนไปภูฏาน",
  "T-4 Ramada Valley",
  "EN 5วัน4คืน Wonders of Bhutan",
  "Package bhutan",
  "5วัน4คืน Wonders of Bhutan",
  "ซัมเมอร์นี้เที่ยวภูฏาน",
  "T-3 Phuntsho Pelri",
  "ค่าเหยียบแผ่นดินคืออะไร ทำไมต้องจ่าย?",
  "P-4 Himalayan Keys Forest Resort",
  "เทศกาลระบำหน้ากาก",
  "6วัน5คืน The Ultimate Bhutan",
  "Green Season 2026",
] as const;

function slugifyId(value: string, index: number) {
  return `wix-${index + 1}-${value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;
}

function defaultTitle(name: string) {
  const exact: Record<string, string> = {
    "หน้าหลัก": "เที่ยวภูฏานต้อง Bhutan Center ที่หนึ่งเรื่องภูฏาน",
    "แพ็กเกจภูฏาน": "แพ็กเกจภูฏาน | Bhutan Center",
    "4วัน3คืน Journey to Bhutan": "4วัน3คืน Journey to Bhutan | Bhutan Center",
    "TH 5วัน4คืน Wonders of Bhutan": "TH 5วัน4คืน Wonders of Bhutan | Bhutan Center",
    "6วัน5คืน The Ultimate Bhutan": "THE ULTIMATE BHUTAN | 6วัน5คืน โรงแรม3ดาว | Bhutan Center",
    "ที่พักในภูฏาน": "ที่พักในภูฏาน | Bhutan Center",
    "ติดต่อเรา": "ติดต่อเรา | Bhutan Center",
    "สถานที่ท่องเที่ยว": "สถานที่ท่องเที่ยว | Bhutan Center",
    "วีซ่าภูฏาน": "วีซ่าภูฏาน | Bhutan Center",
    "รู้ไว้ก่อนไปภูฏาน": "รู้ไว้ก่อนไปภูฏาน | Bhutan Center",
  };
  return exact[name] ?? `${name} | Bhutan Center`;
}

function defaultDescription(name: string) {
  if (name.includes("Journey")) return "เที่ยวภูฏานกับ Journey to Bhutan โปรแกรมทัวร์ส่วนตัว ดูแลเที่ยวบิน วีซ่า SDF ที่พัก ไกด์ รถ และสถานที่สำคัญโดย Bhutan Center";
  if (name.includes("Wonders")) return "Wonders of Bhutan เที่ยวพาโร ทิมพู และพูนาคาแบบ Private Tour พร้อมวัดทักซัง วีซ่า SDF ที่พัก ไกด์ รถ และเที่ยวบิน";
  if (name.includes("Ultimate")) return "The Ultimate Bhutan โปรแกรมทัวร์ภูฏานแบบส่วนตัว ครบเส้นทางสำคัญและวัดทักซัง พร้อมทีม Bhutan Center ดูแลตลอดทริป";
  if (name.includes("ที่พัก") || name.match(/^(P|T|Pu)-/)) return "ข้อมูลที่พักและโรงแรมในภูฏานที่ Bhutan Center คัดเลือกสำหรับการเดินทางแบบส่วนตัว พร้อมคำแนะนำตามเส้นทางและงบประมาณ";
  if (name.includes("วีซ่า")) return "ข้อมูลวีซ่าภูฏาน เอกสารที่ต้องใช้ Sustainable Development Fee (SDF) และขั้นตอนเตรียมตัว โดยทีมผู้เชี่ยวชาญ Bhutan Center";
  if (name === "หน้าหลัก") return "Bhutan Center ผู้เชี่ยวชาญท่องเที่ยวภูฏาน ดูแลแพ็กเกจส่วนตัว ตั๋วเครื่องบิน วีซ่า SDF ที่พัก ไกด์ รถ และวางแผนทริปครบในที่เดียว";
  return `${name} ข้อมูลสำหรับวางแผนเที่ยวภูฏานโดย Bhutan Center ผู้เชี่ยวชาญเส้นทางภูฏานและทริปส่วนตัว`;
}

export const defaultSeoPages: SeoPage[] = pageNames.map((name, index) => {
  const missingTask = incomplete.get(name);
  const path = currentPaths[name] ?? knownLegacyUrls[name] ?? "";
  const isHotel = name.includes("ที่พัก") || /^(P|T|Pu)-/.test(name);
  const isArticle = !currentPaths[name] && !name.includes("Journey") && !name.includes("Wonders") && !name.includes("Ultimate") && name !== "หน้าหลัก";
  return {
    id: slugifyId(name, index),
    name,
    currentPath: path,
    legacyUrl: knownLegacyUrls[name],
    title: defaultTitle(name),
    description: defaultDescription(name),
    focusKeywords: ["เที่ยวภูฏาน", "ทัวร์ภูฏาน", "แพ็กเกจทัวร์ภูฏาน"],
    canonicalUrl: knownLegacyUrls[name] ? `https://www.bhutancenter.org${knownLegacyUrls[name]}` : undefined,
    ogTitle: defaultTitle(name),
    ogDescription: defaultDescription(name),
    indexable: true,
    schemaType: isHotel ? "Hotel" : isArticle ? "Article" : name.includes("Journey") || name.includes("Wonders") || name.includes("Ultimate") ? "TouristTrip" : "WebPage",
    lockLegacyUrl: Boolean(knownLegacyUrls[name]),
    tasks: {
      title: missingTask !== "title",
      description: missingTask !== "description",
      alt: missingTask !== "alt",
      links: missingTask !== "links",
    },
  };
});

export const defaultSeoState: SeoState = {
  site: {
    brandName: "บริษัท omg experience co.ltd",
    siteName: "Bhutan Center",
    domain: "https://www.bhutancenter.org",
    keywords: ["เที่ยวภูฏาน", "ทัวร์ภูฏาน", "แพ็กเกจทัวร์ภูฏาน", "ภูฏานมีอะไรดี", "ประเทศที่ต้องไปสักครั้งในชีวิต"],
    googleSearchConsoleConnected: true,
    customDomainConnected: true,
    homepageIndexing: true,
    mobileOptimized: true,
    sitemapEnabled: true,
    robotsEnabled: true,
    organizationSchemaEnabled: true,
    geoEnabled: true,
  },
  pages: defaultSeoPages,
  redirects: [
    { id: "r1", from: "/contact-us-bhutancenter", to: "/contact", type: 301, enabled: false },
    { id: "r2", from: "/packagetours-bhutan-booking", to: "/booking", type: 301, enabled: false },
  ],
  updatedAt: "2026-09-01T00:00:00.000Z",
};

export function getWixStep2Progress(pages: SeoPage[]) {
  let completed = 0;
  let total = 0;
  for (const page of pages) {
    const keys: (keyof SeoChecklistTasks)[] = page.name === "หน้าหลัก" ? ["alt", "links"] : ["title", "description", "alt", "links"];
    for (const key of keys) {
      total += 1;
      if (page.tasks[key]) completed += 1;
    }
  }
  return { completed, total, missing: total - completed };
}

export function seoPageForPath(path: string, pages = defaultSeoPages) {
  return pages.find((page) => page.currentPath === path || page.legacyUrl === path);
}

export function metadataForPath(path: string, pages: SeoPage[] = defaultSeoPages): Metadata {
  const page = seoPageForPath(path, pages);
  if (!page) return {};
  const canonical = page.canonicalUrl ?? `https://www.bhutancenter.org${path}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.focusKeywords,
    alternates: { canonical },
    robots: page.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: page.ogTitle ?? page.title,
      description: page.ogDescription ?? page.description,
      url: canonical,
      siteName: "Bhutan Center",
      type: "website",
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
  };
}
