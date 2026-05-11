export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  order: number;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  group?: string;
  required?: boolean;
  multiSelect?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  addons: ProductAddon[];
  prepTime?: number;
  badge?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  preference: string;
}

export type OrderStatus = 'novo' | 'confirmado' | 'em_preparo' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado';
export type OrderChannel = 'whatsapp' | 'link' | 'pdv';
export type DeliveryType = 'entrega' | 'retirada' | 'local';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  addons: string[];
  notes: string;
}

export interface Order {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  notes: string;
  total: number;
  payment: string;
  status: OrderStatus;
  createdAt: string;
  address: string;
  channel: OrderChannel;
  deliveryType: DeliveryType;
  changeFor?: number;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  phone: string;
  message: string;
  timestamp: string;
  isBot: boolean;
  orderId?: string;
}

export const categories: Category[] = [];
export const products: Product[] = [];
export const customers: Customer[] = [];
export const orders: Order[] = [];
export const whatsappMessages: WhatsAppMessage[] = [];
