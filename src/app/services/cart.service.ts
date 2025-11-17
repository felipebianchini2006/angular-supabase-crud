import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';
import { CreateOrderData } from '../models/order';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private supabaseService = inject(SupabaseService);
  // Estado do carrinho
  private items = signal<CartItem[]>([]);

  // CEP e frete
  cep = signal<string>('');
  shippingCost = signal<number>(0);

  // Computados
  cartItems = this.items.asReadonly();

  itemCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  subtotal = computed(() => {
    return this.items().reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
  });

  total = computed(() => {
    return this.subtotal() + this.shippingCost();
  });

  constructor() {
    // Carregar carrinho do localStorage
    this.loadCart();
  }

  // Adicionar produto ao carrinho
  addToCart(product: Product) {
    const currentItems = this.items();
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      // Incrementar quantidade
      this.updateQuantity(product.id!, existingItem.quantity + 1);
    } else {
      // Adicionar novo item
      this.items.set([...currentItems, { product, quantity: 1 }]);
    }

    this.saveCart();
  }

  // Atualizar quantidade
  updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) return;

    const currentItems = this.items();
    const updatedItems = currentItems.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    this.items.set(updatedItems);
    this.saveCart();
  }

  // Incrementar quantidade
  incrementQuantity(productId: number) {
    const item = this.items().find(i => i.product.id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  // Decrementar quantidade
  decrementQuantity(productId: number) {
    const item = this.items().find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }

  // Remover item do carrinho
  removeItem(productId: number) {
    const currentItems = this.items();
    this.items.set(currentItems.filter(item => item.product.id !== productId));
    this.saveCart();
  }

  // Limpar carrinho
  clearCart() {
    this.items.set([]);
    this.cep.set('');
    this.shippingCost.set(0);
    this.saveCart();
  }

  // Calcular frete baseado no CEP
  calculateShipping(cep: string) {
    this.cep.set(cep);

    // Se o subtotal for >= R$ 100,00, frete grátis
    if (this.subtotal() >= 100) {
      this.shippingCost.set(0);
      return;
    }

    // Simulação de cálculo de frete
    // Em produção, você faria uma chamada para API dos Correios ou similar
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      // Simular valor de frete baseado no CEP (apenas demonstração)
      // Aqui você poderia integrar com API real de frete
      this.shippingCost.set(15.00);
    } else {
      this.shippingCost.set(0);
    }
  }

  // Verificar se produto está no carrinho
  isInCart(productId: number): boolean {
    return this.items().some(item => item.product.id === productId);
  }

  // Obter quantidade de um produto no carrinho
  getQuantity(productId: number): number {
    const item = this.items().find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  // Salvar carrinho no localStorage
  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.items()));
  }

  // Carregar carrinho do localStorage
  private loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        this.items.set(items);
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e);
      }
    }
  }

  // Criar pedido no Supabase
  async createOrder(): Promise<void> {
    if (this.items().length === 0) {
      throw new Error('Carrinho vazio');
    }

    if (!this.cep()) {
      throw new Error('CEP não informado');
    }

    const orderData: CreateOrderData = {
      cep: this.cep(),
      subtotal: this.subtotal(),
      shipping_cost: this.shippingCost(),
      total: this.total(),
      items: this.items().map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }))
    };

    await this.supabaseService.createOrder(orderData);
  }
}
