let csrfTokenPromise;

const originalFetch = window.fetch.bind(window);

const getCsrfToken = async () => {
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

export const installCsrfFetch = () => {
  window.fetch = async (input, init = {}) => {
    const method = String(init.method || 'GET').toUpperCase();
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    const requiresToken = url.origin === window.location.origin
      && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!requiresToken) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('x-csrf-token', await getCsrfToken());
    return originalFetch(input, { ...init, headers, credentials: init.credentials || 'include' });
  };
};
