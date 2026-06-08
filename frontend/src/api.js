const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('rf_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('rf_token');
    window.dispatchEvent(new Event('rf:logout'));
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/api/auth/me'),

  getMembers: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return request(`/api/members${q ? `?${q}` : ''}`);
  },

  getMember: (id) => request(`/api/members/${id}`),

  addMember: (data) =>
    request('/api/members', { method: 'POST', body: JSON.stringify(data) }),

  cancelMember: (id) =>
    request(`/api/members/${id}/cancel`, { method: 'PATCH' }),

  updateMemberPhoto: (id, photo) =>
    request(`/api/members/${id}/photo`, { method: 'PATCH', body: JSON.stringify({ photo }) }),

  getStats: () => request('/api/members/stats/summary'),

  recordPayment: (data) =>
    request('/api/payments', { method: 'POST', body: JSON.stringify(data) }),

  getPayments: (member_id) =>
    request(`/api/payments${member_id ? `?member_id=${member_id}` : ''}`),

  getRevenue: () => request('/api/payments/revenue'),

  getMemberReceipts: (memberId) => request(`/api/receipts/member/${memberId}`),
  getReceipt: (receiptId) => request(`/api/receipts/${encodeURIComponent(receiptId)}`),

  getReceipts: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return request(`/api/receipts${q ? `?${q}` : ''}`);
  },

  updateMember: (id, data) =>
    request(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updatePayment: (id, data) =>
    request(`/api/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deletePayment: (id) =>
    request(`/api/payments/${id}`, { method: 'DELETE' }),
};
