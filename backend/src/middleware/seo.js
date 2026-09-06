import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { getPageSeo, normalizePath, renderSeoHtml, renderSitemap } from '../../../frontend/src/seo/metadata.js';

// Inject metadata into the initial response, including for crawlers that do not run JS.
export function createSeoMiddleware({ docsDir, getCatalog }) {
  return async (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    if (req.path === '/sitemap.xml') {
      try {
        const catalog = await getCatalog();
        return res.type('application/xml').send(renderSitemap(catalog.visibleCollectionPages));
      } catch (error) {
        console.error('SEO sitemap unavailable:', error.message);
        return res.status(503).set('Retry-After', '300').type('text/plain').send('Sitemap temporarily unavailable.');
      }
    }
    if (/^\/(api|uploads)(\/|$)/.test(req.path)) return next();
    if (path.extname(req.path) && !req.path.endsWith('.html')) return next();
    const normalized = normalizePath(req.path);
    let collection;
    if (/^\/collections\/[^/]+$/.test(normalized)) {
      try {
        const catalog = await getCatalog();
        collection = catalog.visibleCollectionPages.find((page) => `/collections/${page.slug}` === normalized);
      } catch (error) {
        console.error('SEO collection unavailable:', error.message);
        return res.status(503).set('Retry-After', '300').type('text/plain').send('Collection temporarily unavailable.');
      }
    }
    const seo = getPageSeo(normalized, { collection, catalogReady: true });
    try {
      const html = await readFile(path.join(docsDir, 'index.html'), 'utf8');
      if (seo.robots.startsWith('noindex')) res.set('X-Robots-Tag', 'noindex, follow');
      return res.status(seo.status).type('html').send(renderSeoHtml(html, seo));
    } catch (error) { return next(error); }
  };
}
