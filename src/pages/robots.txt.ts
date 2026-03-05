import type { APIRoute } from "astro";

const getSiteOrigin = (url: URL) => String(import.meta.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, "");

export const GET: APIRoute = ({ url }) => {
  const siteOrigin = getSiteOrigin(url);
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    `Sitemap: ${siteOrigin}/sitemap.xml`
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
