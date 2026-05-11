// Shared types and labels used across the admin panel
// These replace the types that were previously in mockData.ts

export type OrderStatus = 'novo' | 'confirmado' | 'em_preparo' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado';
export type OrderChannel = 'whatsapp' | 'link' | 'pdv';
export type DeliveryType = 'entrega' | 'retirada' | 'local';

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  group?: string;
  required?: boolean;
  multiSelect?: boolean;
}

export const statusLabels: Record<OrderStatus, string> = {
  novo: 'Novo Pedido',
  confirmado: 'Confirmado',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu p/ Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const statusColors: Record<OrderStatus, string> = {
  novo: 'bg-blue-500',
  confirmado: 'bg-yellow-500',
  em_preparo: 'bg-orange-500',
  pronto: 'bg-primary',
  saiu_entrega: 'bg-purple-500',
  entregue: 'bg-muted-foreground',
  cancelado: 'bg-destructive',
};

export const channelLabels: Record<string, string> = {
  whatsapp: '📱 WhatsApp',
  link: '🔗 Link',
  pdv: '🏪 PDV',
};

export const deliveryLabels: Record<string, string> = {
  entrega: '🛵 Entrega',
  retirada: '🏪 Retirada',
  local: '🍽️ Local',
};
