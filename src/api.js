// API utility for backend communication
const BASE_URL = 'http://localhost:8000'; // Change if your backend runs elsewhere

// Helper for requests
export async function apiRequest(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // for cookies if needed
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    throw { status: res.status, message: data?.message || res.statusText };
  }
  return data;
}   