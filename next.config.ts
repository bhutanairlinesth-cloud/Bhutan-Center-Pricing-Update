import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/pricing", destination: "/admin", permanent: false },
      { source: "/backoffice", destination: "/admin", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
  async rewrites() {
    return [
      // The existing Bhutan Pricing application is built into /public/admin.
      // Static assets are served normally; all other /admin paths fall back to its SPA shell.
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/:path*", destination: "/admin/index.html" },

      // Public package detail URLs keep their SEO-friendly shape.
      { source: "/packages/:slug", destination: "/package?slug=:slug" },

      // High-value Wix URLs preserved during migration.
      { source: "/packagetour-bhutan-new", destination: "/packages" },
      { source: "/bhutan-journey-to-bhutan-3stars", destination: "/package?slug=journey-to-bhutan" },
      { source: "/th5d4n", destination: "/package?slug=wonders-of-bhutan" },
      { source: "/bhutan-the-ultimate-bhutan-3stars", destination: "/package?slug=the-ultimate-bhutan" },
      { source: "/hotelbhutan", destination: "/hotels" },
      { source: "/how-to-visabhutan", destination: "/visa" },
      { source: "/bhutan-attractions", destination: "/destinations" },
      { source: "/bhutan", destination: "/about-bhutan" },
      { source: "/justletyouknow-bhutan", destination: "/travel-info" },
      { source: "/blog-bhutancenter", destination: "/journal" },
      { source: "/packagetours-bhutan-booking", destination: "/booking" },
      { source: "/contact-us-bhutancenter", destination: "/contact" },
    ];
  },
};

export default nextConfig;
