export const defaultNewArrivalsSettings = () => ({
  enabled: true,
  mode: 'automatic',
  latestCount: 10,
  customCount: 0,
  productIds: [],
})

export const normalizeNewArrivalsSettings = (settings = {}) => ({
  enabled: settings?.enabled !== false,
  mode: ['automatic', 'mixed', 'manual'].includes(settings?.mode) ? settings.mode : 'automatic',
  latestCount: Number.isInteger(settings?.latestCount) && settings.latestCount >= 0 && settings.latestCount <= 10
    ? settings.latestCount : 10,
  customCount: Number.isInteger(settings?.customCount) && settings.customCount >= 0 && settings.customCount <= 10
    ? settings.customCount : 0,
  productIds: [...new Set((Array.isArray(settings?.productIds) ? settings.productIds : []).map(String))],
})

export const newArrivalsProductId = (product) => String(product.catalogId || product.id)

export const isNewArrivalsEligible = (product) => {
  const meta = Array.isArray(product.meta) ? product.meta : [product.meta].filter(Boolean)
  return !product.placeholder && Boolean(product.images?.length)
    && !product.sold && !product.soldOut && product.availableQuantity !== 0
    && !/^sold(?:\s*out)?$/i.test(String(product.status || '').trim())
    && !/^sold(?:\s*out)?$/i.test(String(product.availability || '').trim())
    && !meta.some((item) => /^price:\s*sold(?:\s*out)?\b/i.test(String(item).trim()))
}

export const newArrivalsCandidates = (pages) => pages
  .filter((page) => !page.hidden)
  .flatMap((page) => page.products.map((product) => ({
    ...product,
    collectionTitle: page.title,
    path: `${page.path}#product-${product.id}`,
  })))

export const selectNewArrivals = (pages, settings) => {
  const config = normalizeNewArrivalsSettings(settings)
  if (!config.enabled) return []
  const candidates = newArrivalsCandidates(pages).filter(isNewArrivalsEligible)
  const byId = new Map(candidates.map((product) => [newArrivalsProductId(product), product]))
  const timestamp = (product) => new Date(product.createdAt).getTime() || 0
  const custom = config.mode === 'automatic' ? []
    : config.productIds.map((id) => byId.get(id)).filter(Boolean).slice(0, config.customCount)
  const customIds = new Set(custom.map(newArrivalsProductId))
  const latest = config.mode === 'manual' ? []
    : candidates.filter((product) => !customIds.has(newArrivalsProductId(product)))
      .sort((left, right) => timestamp(right) - timestamp(left)
        || newArrivalsProductId(left).localeCompare(newArrivalsProductId(right)))
      .slice(0, config.latestCount)
  return [...latest, ...custom].slice(0, 10)
}
