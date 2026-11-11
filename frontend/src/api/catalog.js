const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'An unknown error occurred. Please try again.');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const catalogApi = {
  getCatalog: (options) => request('/api/storefront/catalog', { cache: 'no-store', ...options }),
  getCollection: (slug) => request(`/api/storefront/collections/${slug}`),
  getSubcollections: (slug) => request(`/api/storefront/collections/${slug}/subcollections`),
  getProducts: (slug, subCollectionId = null) => {
    const params = subCollectionId ? `?subCollectionId=${encodeURIComponent(subCollectionId)}` : '';
    return request(`/api/storefront/collections/${slug}/products${params}`);
  },
};
