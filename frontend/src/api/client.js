/**
 * Centralized API Client for ThreadCraft Luxe Backend (Flask REST API)
 * Communicates with Flask backend over /api proxy in development or production URL.
 */

const BASE_URL = '/api';

const getHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('tc_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  post: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  patch: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

// Domain-specific endpoints
export const authApi = {
  login: async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    if (data.token) {
      localStorage.setItem('tc_auth_token', data.token);
    }
    return data;
  },
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const productsApi = {
  getAll: (category) => api.get(`/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getByBarcode: (code) => api.get(`/products/barcode/${encodeURIComponent(code)}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
};

export const posApi = {
  getOrders: () => api.get('/pos/orders'),
  checkout: (saleData) => api.post('/pos/checkout', saleData),
};

export const bookingsApi = {
  getAll: () => api.get('/bookings'),
  create: (bookingData) => api.post('/bookings', bookingData),
  deliverAndSettle: (bookingId) => api.post(`/bookings/${bookingId}/deliver-and-settle`, {}),
  getMasterJobs: (master, month) => {
    const params = new URLSearchParams();
    if (master) params.append('master', master);
    if (month) params.append('month', month);
    return api.get(`/bookings/master-jobs?${params.toString()}`);
  },
  completeMasterJob: (jobId) => api.post(`/bookings/master-jobs/${jobId}/complete`, {}),
};

export const employeesApi = {
  getAll: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (empId, updates) => api.patch(`/employees/${empId}`, updates),
  updateSalary: (empId, updates) => api.patch(`/employees/${empId}/salary`, updates),
  grantAdvanceLoan: (empId, amount, monthlyDeduction) =>
    api.post(`/employees/${empId}/advance-loan`, { amount, monthlyDeduction }),
  getAttendance: () => api.get('/employees/attendance'),
  logAttendance: (record) => api.post('/employees/attendance', record),
  updateAttendance: (attendanceId, updates) => api.patch(`/employees/attendance/${attendanceId}`, updates),
  getWorkPayments: (status = 'READY_FOR_PAYMENT') => api.get(`/employees/work-payments?status=${encodeURIComponent(status)}`),
  settleWorkPayment: (jobId, paymentMethod = 'Cash') => api.post(`/employees/work-payments/${jobId}/settle`, { paymentMethod }),
  settleProductionBalance: (empId, paymentMethod = 'Cash') => api.post(`/employees/${empId}/production-payout`, { paymentMethod }),
};

export const customersApi = {
  getAll: () => api.get('/customers'),
  create: (customerData) => api.post('/customers', customerData),
  getMeasurements: (customerId) => api.get(`/customers/measurements${customerId ? `?customerId=${customerId}` : ''}`),
  saveMeasurement: (data) => api.post('/customers/measurements', data),
};

export const ledgerApi = {
  getAll: () => api.get('/ledger'),
  addEntry: (entry) => api.post('/ledger', entry),
  getStages: () => api.get('/ledger/stages'),
  createStage: (data) => api.post('/ledger/stages', data),
  updateStage: (id, updates) => api.patch(`/ledger/stages/${id}`, updates),
  getProductionJobs: (status) => api.get(`/ledger/production-jobs${status ? `?status=${encodeURIComponent(status)}` : ''}`),
};

export const purchasesApi = {
  getVendors: () => api.get('/purchases/vendors'),
  createVendor: (data) => api.post('/purchases/vendors', data),
  deleteVendor: (id) => api.delete(`/purchases/vendors/${id}`),
  getOrders: () => api.get('/purchases/orders'),
  createOrder: (data) => api.post('/purchases/orders', data),
  receiveOrder: (id) => api.post(`/purchases/orders/${id}/receive`, {}),
};
