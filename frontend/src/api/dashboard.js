import { showDashboardToast } from '../utils/dashboardToast.js';
import { getCsrfToken } from './csrf.js';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const statusMessages = {
  400: 'The submitted information is invalid. Check the form and try again.',
  401: 'Your session has expired. Sign in again and retry the request.',
  403: 'The request was blocked because your session is no longer valid. Refresh the page and try again.',
  404: 'The requested item could not be found. It may have been removed.',
  408: 'The request timed out. Check your connection and try again.',
  409: 'The request conflicts with a recent change. Refresh the page and try again.',
  413: 'The selected files are too large to upload in one request. Try fewer or smaller files.',
  422: 'Some submitted information could not be processed. Review the form and try again.',
  429: 'Too many requests were sent. Wait a moment and try again.',
  500: 'The server encountered an error while completing the request. Please try again.',
  502: 'The server is temporarily unavailable. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

const request = async (url, options = {}, successMessage = '') => {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: isFormData
        ? { ...options.headers }
        : {
          ...jsonHeaders,
          ...options.headers,
        },
    });
  } catch (cause) {
    const message = typeof navigator !== 'undefined' && !navigator.onLine
      ? 'The request failed because this device is offline. Reconnect and try again.'
      : 'The request could not reach the server. Check your connection and try again.';
    const error = new Error(message, { cause });
    error.status = 0;
    showDashboardToast(message, { title: 'Request failed' });
    throw error;
  }

  const responseType = response.headers.get('content-type') || '';
  const data = responseType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const fallbackMessage = statusMessages[response.status]
      || `The request failed with server response ${response.status}. Please try again.`;
    const error = new Error(data.error || data.message || fallbackMessage);
    error.status = response.status;
    showDashboardToast(error.message, { title: 'Request failed' });
    throw error;
  }

  if (successMessage) {
    showDashboardToast(successMessage, { type: 'success', title: 'Success' });
  }

  return data;
};

const uploadRequest = async (url, method, formData, onProgress, successMessage) => {
  const token = await getCsrfToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('x-csrf-token', token);
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener('load', () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        if (successMessage) showDashboardToast(successMessage, { type: 'success', title: 'Success' });
        resolve(data);
        return;
      }
      const error = new Error(data.error || data.message || statusMessages[xhr.status] || 'The upload failed. Your local draft is still available; retry when ready.');
      error.status = xhr.status;
      showDashboardToast(error.message, { title: 'Upload failed' });
      reject(error);
    });
    xhr.addEventListener('error', () => reject(new Error('The upload was interrupted. Your local draft is still available; check the connection and retry.')));
    xhr.addEventListener('abort', () => reject(new Error('The upload was paused. Your local draft is still available to retry.')));
    xhr.send(formData);
  });
};

export const dashboardApi = {
  getStats: () => request('/api/dashboard/stats'),
  getSettings: () => request('/api/settings'),
  updateSettings: (settings) => request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }, 'Store settings saved successfully.'),
  getOrders: (status = 'all') => request(`/api/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  getOrder: (id) => request(`/api/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Order status updated successfully.'),
  resolveOrder: (id, resolution) => request(`/api/orders/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  }, 'Order resolved successfully.'),
  getGroupedProducts: () => request('/api/products/grouped'),
  getProducts: (params = {}) => {
    const search = new URLSearchParams()
    if (params.collectionId) search.set('collectionId', params.collectionId)
    if (params.subCollectionId) search.set('subCollectionId', params.subCollectionId)
    const query = search.toString()
    return request(`/api/products${query ? `?${query}` : ''}`)
  },
  getProduct: (id) => request(`/api/products/${id}`),
  getCollections: () => request('/api/collections'),
  createCollection: (name) => request('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, 'Collection created successfully.'),
  updateCollection: (id, name) => request(`/api/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }, 'Collection renamed successfully.'),
  deleteCollection: (id, confirmName) => request(`/api/collections/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirmDelete: true, confirmName }),
  }, 'Collection deleted successfully.'),
  createProduct: (formData, options = {}) => uploadRequest('/api/products', 'POST', formData, options.onProgress, 'Item and media uploaded successfully.'),
  updateProduct: (id, payload, options = {}) => payload instanceof FormData
    ? uploadRequest(`/api/products/${id}`, 'PUT', payload, options.onProgress, 'Item changes and media saved successfully.')
    : request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, 'Item changes and media saved successfully.'),
  deleteProduct: (id) => request(`/api/products/${id}`, {
    method: 'DELETE',
  }, 'Item removed successfully.'),
  getSubcollections: (collectionId) => request(`/api/collections/${collectionId}/subcollections`),
  createSubcollection: (collectionId, name) => request(`/api/collections/${collectionId}/subcollections`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, 'Filter/sub-collection created successfully.'),
  updateSubcollection: (collectionId, subcollectionId, name) => request(
    `/api/collections/${collectionId}/subcollections/${subcollectionId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ name }),
    },
    'Filter/sub-collection renamed successfully.',
  ),
  deleteSubcollection: (collectionId, subcollectionId) => request(
    `/api/collections/${collectionId}/subcollections/${subcollectionId}`,
    {
      method: 'DELETE',
    },
    'Filter/sub-collection deleted successfully.',
  ),
};
