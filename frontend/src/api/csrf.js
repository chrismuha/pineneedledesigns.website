let csrfTokenPromise;

const originalFetch = window.fetch.bind(window);

export const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = originalFetch('/api/csrf-token', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to obtain CSRF token.');
        return (await response.json()).token;
      })
      .catch((error) => {
        csrfTokenPromise = undefined;
        throw error;
      });
  }
  return csrfTokenPromise;
};

export const clearCsrfToken = () => {
  csrfTokenPromise = undefined;
};

const clearDashboardAppCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
};

export const refreshDashboardApp = async () => {
  const response = await originalFetch('/api/app/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('The dashboard could not be refreshed. Please try again.');
  clearCsrfToken();
  await clearDashboardAppCaches();
};

export const resetDashboardSession = async () => {
  const response = await originalFetch('/api/session/reset', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('The dashboard session could not be reset. Please try again.');
  clearCsrfToken();

  await clearDashboardAppCaches();
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  });
};

export const installCsrfFetch = () => {
  window.fetch = async (input, init = {}) => {
    const method = String(init.method || 'GET').toUpperCase();
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    const requiresToken = url.origin === window.location.origin
      && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!requiresToken) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('x-csrf-token', await getCsrfToken());
    const requestInit = { ...init, headers, credentials: init.credentials || 'include' };
    let response = await originalFetch(input, requestInit);

    // A page can remain open longer than the server session. Obtain a token
    // from the new session and retry once instead of trapping the user in a
    // stale-token loop.
    if (response.status === 403) {
      const payload = await response.clone().json().catch(() => ({}));
      if (/token expired|csrf/i.test(String(payload.error || payload.message || ''))) {
        clearCsrfToken();
        headers.set('x-csrf-token', await getCsrfToken());
        response = await originalFetch(input, { ...requestInit, headers });
      }
    }

    return response;
  };
};
