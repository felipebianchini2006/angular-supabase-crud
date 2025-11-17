import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  items: CartItem[];
  cep?: string;
  shippingCost: number;
  subtotal: number;
  total: number;
}
