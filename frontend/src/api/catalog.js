const request = async (url) => {
  const response = await fetch(url, {
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const catalogApi = {
  getCatalog: () => request('/api/storefront/catalog'),
  getCollection: (slug) => request(`/api/storefront/collections/${slug}`),
  getSubcollections: (slug) => request(`/api/storefront/collections/${slug}/subcollections`),
  getProducts: (slug, subCollectionId = null) => {
    const params = subCollectionId ? `?subCollectionId=${encodeURIComponent(subCollectionId)}` : '';
    return request(`/api/storefront/collections/${slug}/products${params}`);
  },
};
