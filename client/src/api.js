const TOKEN_KEY = 'notes-keeper-token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

export const api = {
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      token: ''
    });
  },
  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      token: ''
    });
  },
  me() {
    return request('/auth/me');
  },
  updateProfile(payload) {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  listNotes(query = '') {
    const searchParam = query ? `?q=${encodeURIComponent(query)}` : '';
    return request(`/notes${searchParam}`);
  },
  createNote(payload) {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateNote(id, payload) {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteNote(id) {
    return request(`/notes/${id}`, {
      method: 'DELETE'
    });
  }
};
