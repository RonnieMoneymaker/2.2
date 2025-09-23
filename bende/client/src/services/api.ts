import axios from 'axios';
import { Customer, Order, DashboardStats, PaginatedResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Customers API
export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),
  
  getById: (id: number) =>
    api.get<Customer>(`/customers/${id}`),
  
  create: (customer: Omit<Customer, 'id' | 'date_created' | 'total_orders' | 'total_spent'>) =>
    api.post<{ message: string; customerId: number }>('/customers', customer),
  
  update: (id: number, customer: Partial<Customer>) =>
    api.put<{ message: string }>(`/customers/${id}`, customer),
  
  delete: (id: number) =>
    api.delete<{ message: string }>(`/customers/${id}`),
  
  addInteraction: (id: number, interaction: {
    interaction_type: 'email' | 'phone' | 'chat' | 'meeting' | 'note';
    subject: string;
    description?: string;
    created_by?: string;
  }) =>
    api.post<{ message: string; interactionId: number }>(`/customers/${id}/interactions`, interaction),
};

// Orders API
export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; customer_id?: number }) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),
  
  getById: (id: number) =>
    api.get<Order>(`/orders/${id}`),
  
  create: (order: {
    customer_id: number;
    order_number: string;
    total_amount: number;
    currency?: string;
    payment_method?: string;
    shipping_address?: string;
    notes?: string;
    items: Array<{
      product_name: string;
      product_sku?: string;
      quantity: number;
      unit_price: number;
    }>;
  }) =>
    api.post<{ message: string; orderId: number }>('/orders', order),
  
  updateStatus: (id: number, status: string, tracking_number?: string) =>
    api.patch<{ message: string }>(`/orders/${id}/status`, { status, tracking_number }),
  
  getStats: (period?: string) =>
    api.get<any>(`/orders/stats/summary`, { params: { period } }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () =>
    api.get<DashboardStats>('/analytics/dashboard'),
  
  getSalesOverTime: (params?: { period?: string; interval?: string }) =>
    api.get<{
      period: string;
      interval: string;
      data: Array<{
        period: string;
        orders: number;
        revenue: number;
        avg_order_value: number;
      }>;
    }>('/analytics/sales-over-time', { params }),
  
  getCustomerAnalytics: () =>
    api.get<any>('/analytics/customers'),
  
  getProductAnalytics: (params?: { period?: string }) =>
    api.get<any>('/analytics/products', { params }),
  
  getRetentionMetrics: () =>
    api.get<any>('/analytics/retention'),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get<{ products: any[] }>('/products', { params }),
  
  getById: (id: number) =>
    api.get<any>(`/products/${id}`),
  
  create: (product: any) =>
    api.post<{ message: string; productId: number }>('/products', product),
  
  update: (id: number, product: any) =>
    api.put<{ message: string }>(`/products/${id}`, product),
  
  delete: (id: number) =>
    api.delete<{ message: string }>(`/products/${id}`)
};

// Costs API
export const costsApi = {
  getFixedCosts: (params?: { category?: string }) =>
    api.get<{ fixed_costs: any[] }>('/costs/fixed-costs', { params }),
  
  getFixedCostsSummary: () =>
    api.get<{ summary: any[]; totals: any }>('/costs/fixed-costs/summary'),
  
  createFixedCost: (cost: any) =>
    api.post<{ message: string; costId: number }>('/costs/fixed-costs', cost),
  
  updateFixedCost: (id: number, cost: any) =>
    api.put<{ message: string }>(`/costs/fixed-costs/${id}`, cost),
  
  deleteFixedCost: (id: number) =>
    api.delete<{ message: string }>(`/costs/fixed-costs/${id}`)
};

// Profit API
export const profitApi = {
  getAnalysis: (params?: { start_date?: string; end_date?: string }) =>
    api.get<any>('/profit/analysis', { params }),
  
  getComparison: (params: { current_start: string; current_end: string; previous_start: string; previous_end: string }) =>
    api.get<any>('/profit/comparison', { params }),
  
  getBreakEven: (params?: { period?: string }) =>
    api.get<any>('/profit/break-even', { params })
};

// AI API
export const aiApi = {
  getProductRecommendations: (params?: { period?: string }) =>
    api.get<any>('/ai/product-recommendations', { params }),
  
  getCustomerInsights: () =>
    api.get<any>('/ai/customer-insights'),
  
  getBusinessHealth: () =>
    api.get<any>('/ai/business-health'),
  
  getDashboard: () =>
    api.get<any>('/ai/dashboard')
};

// Fulfillment API
export const fulfillmentApi = {
  createShippingLabel: (orderId: number, options?: any) =>
    api.post<any>(`/fulfillment/orders/${orderId}/create-label`, options),
  
  createBulkLabels: (orderIds: number[], options?: any) =>
    api.post<any>('/fulfillment/orders/bulk/create-labels', { order_ids: orderIds, ...options }),
  
  downloadPackingSlips: (orderIds: number[]) =>
    api.post('/fulfillment/orders/bulk/packing-slips', { order_ids: orderIds }, { responseType: 'blob' }),
  
  getTrackingInfo: (trackingNumber: string) =>
    api.get<any>(`/fulfillment/tracking/${trackingNumber}`)
};

// Shipping API
export const shippingApi = {
  calculateShipping: (data: { country: string; items: any[]; total_value: number }) =>
    api.post<any>('/shipping/calculate', data),
  
  calculateTax: (data: { country: string; items: any[]; subtotal: number }) =>
    api.post<any>('/shipping/calculate-tax', data),
  
  getShippingRules: (params?: { country?: string }) =>
    api.get<{ shipping_rules: any[] }>('/shipping/rules', { params }),
  
  getTaxRules: (params?: { country?: string }) =>
    api.get<{ tax_rules: any[] }>('/shipping/tax-rules', { params })
};

// API Settings API
export const apiSettingsApi = {
  getSettings: () =>
    api.get<{ settings: any; platforms: string[] }>('/settings'),
  
  updateSetting: (platform: string, key: string, value: string) =>
    api.put<{ message: string; settingId: number }>(`/settings/${platform}/${key}`, { value }),
  
  testConnection: (platform: string, credentials: any) =>
    api.post<{ success: boolean; message: string; details?: any }>(`/settings/test/${platform}`, { credentials }),
  
  deleteSetting: (platform: string, key: string) =>
    api.delete<{ message: string }>(`/settings/${platform}/${key}`)
};

export default api;
