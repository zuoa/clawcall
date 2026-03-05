import type { APIRoute } from "astro";

const getSiteOrigin = (url: URL) => String(import.meta.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, "");

export const GET: APIRoute = ({ url }) => {
  const siteOrigin = getSiteOrigin(url);
  const lastmod = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteOrigin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
