export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at?: string;
}

export interface Order {
  id?: number;
  user_id?: string;
  cep: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface CreateOrderData {
  cep: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: {
    product_id: number | undefined;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
  }[];
}
