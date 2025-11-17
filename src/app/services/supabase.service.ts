import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Product } from '../models/product';
import { Order, OrderItem, CreateOrderData } from '../models/order';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  // Produtos
  products = signal<Product[]>([]);

  // Pedidos
  orders = signal<Order[]>([]);

  // Usuário logado
  user = signal<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Inicializa usuário
    this.supabase.auth.getSession().then(({ data }) => {
      this.user.set(data?.session?.user ?? null);
    });

    // Observa mudanças de autenticação
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
    });
  }

  // -------------------------
  // Auth
  // -------------------------

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    if (error) throw error;
    this.user.set(data.user);
    return data.user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
    // Verifica se o usuário foi criado
    // Se user existe mas session não, pode ser:
    // 1. Confirmação de email necessária
    // 2. Email já existe e Supabase retornou sucesso falso (fake success)
    if (!data.user) {
      throw new Error('Não foi possível criar a conta. O email pode já estar cadastrado.');
    }
    
    // Se auto-confirmação está habilitada, o usuário já estará logado
    if (data.user && data.session) {
      this.user.set(data.user);
    }
    
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.user.set(null);
  }

  // -------------------------
  // Produtos (CRUD)
  // -------------------------

  async loadProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    this.products.set(data as Product[]);
  }

  async addProduct(product: Product) {
    const { error } = await this.supabase.from('products').insert([product]);
    if (error) throw error;
    await this.loadProducts();
  }

  async updateProduct(id: number, updates: Partial<Product>) {
    const { error } = await this.supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
    await this.loadProducts();
  }

  async deleteProduct(id: number) {
    const { error } = await this.supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await this.loadProducts();
  }

  // -------------------------
  // Pedidos (Orders)
  // -------------------------

  async loadOrders() {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    this.orders.set(data as Order[]);
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data as Order;
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // 1. Criar o pedido
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert([{
        user_id: this.user()?.id,
        cep: orderData.cep,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shipping_cost,
        total: orderData.total,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Criar os itens do pedido
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await this.supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 3. Recarregar pedidos
    await this.loadOrders();

    return order as Order;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const { error } = await this.supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    await this.loadOrders();
  }

  async deleteOrder(orderId: number) {
    const { error } = await this.supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    await this.loadOrders();
  }
}
