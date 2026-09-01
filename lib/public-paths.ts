export const publicPaths = {
  home: "/",
  packages: "/packagetour-bhutan-new",
  journey4d3n: "/bhutan-journey-to-bhutan-3stars",
  wonders5d4n: "/th5d4n",
  ultimate6d5n: "/bhutan-the-ultimate-bhutan-3stars",
  hotels: "/hotelbhutan",
  visa: "/how-to-visabhutan",
  destinations: "/bhutan-attractions",
  aboutBhutan: "/bhutan",
  travelInfo: "/justletyouknow-bhutan",
  journal: "/blog-bhutancenter",
  booking: "/packagetours-bhutan-booking",
  contact: "/contact-us-bhutancenter",
} as const;

export function packagePublicPath(slug: string) {
  if (slug === "journey-to-bhutan") return publicPaths.journey4d3n;
  if (slug === "wonders-of-bhutan") return publicPaths.wonders5d4n;
  if (slug === "the-ultimate-bhutan") return publicPaths.ultimate6d5n;
  return `/packages/${slug}`;
}
