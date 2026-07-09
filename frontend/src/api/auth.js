const jsonHeaders = {
  'Content-Type': 'application/json',
};

const request = async (url, options = {}) => {
  let response;

  try {
    response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...jsonHeaders,
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot connect to the dashboard login service. Make sure the backend server is running.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? 'The dashboard login service is temporarily unavailable. Please try again.'
      : 'Request failed.';
    const error = new Error(data.error || data.message || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const authApi = {
  getMe: () => request('/api/auth/me'),
  signInWithEmail: (email) => request('/api/auth/email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  logout: () => request('/api/auth/logout', {
    method: 'POST',
  }),
};
