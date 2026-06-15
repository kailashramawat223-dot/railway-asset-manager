// ─── API Configuration ───────────────────────────────────────────────────────
const CONFIG = {
  API_BASE: 'http://localhost:5001/api',
  APP_NAME: 'RailTrack',
  VERSION: '1.0.0'
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('ram_token'),
  getUser: () => JSON.parse(localStorage.getItem('ram_user') || 'null'),
  setSession: (token, user) => {
    localStorage.setItem('ram_token', token);
    localStorage.setItem('ram_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('ram_token');
    localStorage.removeItem('ram_user');
  },
  isLoggedIn: () => !!localStorage.getItem('ram_token'),
  requireAuth: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '../index.html';
      return false;
    }
    return true;
  },
  hasRole: (...roles) => {
    const user = Auth.getUser();
    return user && roles.includes(user.role);
  }
};

// ─── API Helper ───────────────────────────────────────────────────────────────
const API = {
  request: async (endpoint, options = {}) => {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    const data = await response.json();

    if (response.status === 401) {
      Auth.clearSession();
      window.location.href = '../index.html';
      return;
    }

    return { ok: response.ok, status: response.status, data };
  },

  get: (endpoint) => API.request(endpoint),
  post: (endpoint, body) => API.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => API.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => API.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => API.request(endpoint, { method: 'DELETE' })
};

// ─── Toast Notifications ─────────────────────────────────────────────────────
const Toast = {
  show: (message, type = 'info', duration = 3500) => {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info'),
  warning: (msg) => Toast.show(msg, 'warning')
};

// ─── Format Helpers ───────────────────────────────────────────────────────────
const Format = {
  date: (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  datetime: (d) => d ? new Date(d).toLocaleString('en-IN') : '—',
  statusBadge: (status) => {
    const map = {
      'Operational': 'badge-success',
      'Under Maintenance': 'badge-warning',
      'Faulty': 'badge-danger',
      'Decommissioned': 'badge-secondary',
      'Standby': 'badge-info'
    };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
  }
};
