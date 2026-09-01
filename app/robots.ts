import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/api/"] },
    ],
    sitemap: "https://www.bhutancenter.org/sitemap.xml",
    host: "https://www.bhutancenter.org",
  };
}
