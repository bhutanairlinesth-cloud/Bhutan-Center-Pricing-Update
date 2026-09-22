import type { MetadataRoute } from "next";
import { getPublicPackages } from "@/lib/pricing-source";
import { packagePublicPath, publicPaths } from "@/lib/public-paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.bhutancenter.org";
  const cityRoutes = [
    "/bhutan-attractions/paro",
    "/bhutan-attractions/thimphu",
    "/bhutan-attractions/punakha",
    "/bhutan-attractions/gangtey-phobjikha",
  ];
  const staticRoutes = [publicPaths.home, publicPaths.packages, "/bhutan-airlines", publicPaths.visa, publicPaths.hotels, publicPaths.destinations, publicPaths.aboutBhutan, publicPaths.travelInfo, publicPaths.journal, publicPaths.booking, publicPaths.contact, "/partner"];
  const packages = await getPublicPackages();
  return [
    ...[...staticRoutes, ...cityRoutes].map((route, index) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: index === 0 ? "weekly" as const : "monthly" as const, priority: index === 0 ? 1 : .7 })),
    ...packages.map((item) => ({ url: `${base}${packagePublicPath(item.slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .9 })),
  ];
}
