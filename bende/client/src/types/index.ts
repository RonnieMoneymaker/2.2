export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  date_created: string;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  customer_status: 'new' | 'active' | 'inactive' | 'vip';
  notes?: string;
  orders?: Order[];
  interactions?: CustomerInteraction[];
}

export interface Order {
  id: number;
  customer_id: number;
  order_number: string;
  order_date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  payment_method?: string;
  shipping_address?: string;
  tracking_number?: string;
  notes?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  item_count?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CustomerInteraction {
  id: number;
  customer_id: number;
  interaction_type: 'email' | 'phone' | 'chat' | 'meeting' | 'note';
  subject: string;
  description?: string;
  date_created: string;
  created_by: string;
}

export interface DashboardStats {
  totalCustomers: { count: number };
  newCustomersThisMonth: { count: number };
  totalOrders: { count: number };
  ordersThisMonth: { count: number };
  totalRevenue: { total: number };
  revenueThisMonth: { total: number };
  avgOrderValue: { avg: number };
  topCustomers: Customer[];
  recentOrders: Order[];
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
}

export interface SalesData {
  period: string;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

export interface PaginatedResponse<T> {
  data?: T[];
  customers?: T[];
  orders?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
