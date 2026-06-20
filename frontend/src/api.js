const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getSession() {
  const raw = localStorage.getItem('movie-booking-session');
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(session) {
  localStorage.setItem('movie-booking-session', JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem('movie-booking-session');
}

export async function api(path, options = {}) {
  const session = getSession();
  
  const headers = {
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers
  };

  // Only default to JSON if body isn't FormData and Content-Type isn't manually overridden
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}
