export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  categoryId?: number | null;
  images?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  websiteId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
}

export interface Order {
  id: number;
  websiteId: number;
  customerId: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitCents: number;
  totalCents: number;
  product?: Product;
}

export interface Stats {
  products: number;
  categories: number;
  customers: number;
  orders: number;
  salesOverTime: Array<{
    date: string;
    totalCents: number;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}