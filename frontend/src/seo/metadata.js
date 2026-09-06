export const SITE_ORIGIN = 'https://pineneedledesigns.store'
export const SITE_NAME = 'Pine Needle Designs'
export const HOME_DESCRIPTION = 'Discover one-of-a-kind upcycled clothing, denim jackets, jewelry and handbags by Wende Maliani in Remsen, NY, serving Central New York and shipping nationwide.'
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large'

export const LOCAL_SERVICE_AREAS = [
  'Remsen',
  'Barneveld',
  'Holland Patent',
  'Prospect',
  'Boonville',
  'Trenton',
  'Marcy',
  'Whitesboro',
  'Deerfield',
  'Utica',
  'Rome',
  'New Hartford',
  'West Leyden',
  'Port Leyden',
  'Lowville',
  'Croghan',
  'Camden',
  'Syracuse',
]

export const LOCAL_SERVICE_REGIONS = [
  'Central New York',
  'Mohawk Valley',
  'Black River Valley',
  'Hudson Valley',
  'Tug Hill Region',
  'North Country',
  'Adirondack Region',
]

export const publicPages = [
  { path: '/', title: 'Upcycled Clothing in Remsen, NY | Pine Needle Designs', description: HOME_DESCRIPTION },
  { path: '/collections', title: 'Clothing, Jewelry & Handbag Collections | Pine Needle Designs', description: 'Browse Pine Needle Designs collections of upcycled clothing, embellished denim, jewelry, handbags and one-of-a-kind accessories.' },
  { path: '/about', title: 'Remsen, NY Fashion Designer | Pine Needle Designs', description: 'Meet Wende Maliani of Pine Needle Designs in Remsen, NY, creating one-of-a-kind upcycled clothing and accessories for Central New York and customers nationwide.' },
  { path: '/privacy-policy', title: 'Privacy Policy | Pine Needle Designs', description: 'Read the Pine Needle Designs privacy policy.' },
  { path: '/refund-policy', title: 'Refund Policy | Pine Needle Designs', description: 'Review the Pine Needle Designs refund policy before placing your order.' },
  { path: '/shipping-policy', title: 'Shipping Policy | Pine Needle Designs', description: 'Read about shipping for Pine Needle Designs clothing and accessories.' },
  { path: '/terms-of-service', title: 'Terms of Service | Pine Needle Designs', description: 'Review the terms of service for shopping with Pine Needle Designs.' },
]

export const normalizePath = (path) => {
  const pathname = String(path).split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (pathname === '/index.html') return '/'
  const alias = publicPages.find((page) => `${page.path}.html` === pathname)
  return alias?.path || pathname
}

const plainText = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const imageUrl = (value) => {
  try {
    const url = new URL(value || '/images/wende-ai.webp', SITE_ORIGIN)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : `${SITE_ORIGIN}/images/wende-ai.webp`
  } catch { return `${SITE_ORIGIN}/images/wende-ai.webp` }
}

export function getPageSeo(path, { collection, catalogReady = false } = {}) {
  const normalized = normalizePath(path)
  const page = publicPages.find((entry) => entry.path === normalized)
  const privatePage = /^\/dashboard(?:\/|$)/.test(normalized)
    || /^\/booking\/(fitting|brides)$/.test(normalized)
    || ['/order-success', '/order-failure', '/order-cancelled', '/booking-payment-success'].includes(normalized)
  const collectionRoute = /^\/collections\/[^/]+$/.test(normalized)
  const foundCollection = collectionRoute && collection && !collection.hidden
  const pendingCollection = collectionRoute && !catalogReady
  const notFound = !page && !privatePage && !foundCollection && !pendingCollection
  const title = page?.title || (foundCollection ? `${plainText(collection.title)} | ${SITE_NAME}`
    : privatePage ? `Booking & Account | ${SITE_NAME}`
      : notFound ? `Page Not Found | ${SITE_NAME}` : `Collection | ${SITE_NAME}`)
  const description = page?.description || (foundCollection
    ? plainText(collection.description).slice(0, 170) || `Explore ${plainText(collection.title)} at ${SITE_NAME}.`
    : notFound ? 'The requested page could not be found.' : `Visit ${SITE_NAME}.`)
  return {
    title, description,
    canonical: notFound ? null : `${SITE_ORIGIN}${normalized}`,
    robots: privatePage || notFound ? 'noindex, follow' : INDEX_ROBOTS,
    image: imageUrl(foundCollection ? collection.cardImage : null),
    imageAlt: foundCollection ? plainText(collection.title) : 'Wende of Pine Needle Designs',
    status: notFound ? 404 : 200,
  }
}

export function renderSeoHead(seo) {
  const meta = (attribute, name, content) => `<meta data-seo ${attribute}="${name}" content="${escapeHtml(content)}">`
  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    meta('name', 'description', seo.description), meta('name', 'robots', seo.robots),
    meta('property', 'og:type', 'website'), meta('property', 'og:site_name', SITE_NAME), meta('property', 'og:locale', 'en_US'),
    meta('property', 'og:title', seo.title), meta('property', 'og:description', seo.description),
    meta('property', 'og:image', seo.image), meta('property', 'og:image:alt', seo.imageAlt),
    meta('name', 'twitter:card', 'summary_large_image'), meta('name', 'twitter:title', seo.title),
    meta('name', 'twitter:description', seo.description), meta('name', 'twitter:image', seo.image), meta('name', 'twitter:image:alt', seo.imageAlt),
  ]
  if (seo.canonical) tags.push(`<link data-seo rel="canonical" href="${escapeHtml(seo.canonical)}">`, meta('property', 'og:url', seo.canonical))
  if (seo.robots === INDEX_ROBOTS) {
    const data = { '@context': 'https://schema.org', '@graph': [
      {
        '@type': 'Store',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        description: HOME_DESCRIPTION,
        image: `${SITE_ORIGIN}/images/wende-ai.webp`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Remsen',
          addressRegion: 'NY',
          addressCountry: 'US',
        },
        areaServed: [
          ...LOCAL_SERVICE_AREAS.map((name) => ({ '@type': 'City', name: `${name}, New York` })),
          ...LOCAL_SERVICE_REGIONS.map((name) => ({ '@type': 'Place', name })),
        ],
        makesOffer: [
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'One-of-a-kind upcycled clothing and accessories' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Personal fittings and bridal appointments' } },
        ],
      },
      { '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, name: SITE_NAME, url: `${SITE_ORIGIN}/`, publisher: { '@id': `${SITE_ORIGIN}/#organization` } },
    ] }
    tags.push(`<script data-seo type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
  }
  return tags.join('\n')
}

export function renderSeoHtml(html, seo) {
  return html.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<(?:meta|link)\b[^>]*\bdata-seo(?:="[^"]*")?[^>]*>/gi, '')
    .replace(/<script\b[^>]*\bdata-seo(?:="[^"]*")?[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${renderSeoHead(seo)}\n</head>`)
}

export function applyPageSeo(seo) {
  document.head.querySelectorAll('[data-seo], title').forEach((element) => element.remove())
  document.head.insertAdjacentHTML('beforeend', renderSeoHead(seo))
}

export function renderSitemap(collections = []) {
  const paths = [...publicPages.map((page) => page.path), ...collections
    .filter((collection) => !collection.hidden && /^[a-z0-9][a-z0-9-]*$/.test(collection.slug))
    .map((collection) => `/collections/${collection.slug}`)]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map((path) => `  <url><loc>${escapeHtml(SITE_ORIGIN + path)}</loc></url>`).join('\n')}\n</urlset>\n`
}
