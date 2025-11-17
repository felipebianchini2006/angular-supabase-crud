import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { SupabaseService } from '../services/supabase.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatBadgeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  features = [
    {
      icon: 'inventory_2',
      title: 'Gerenciar Produtos',
      description: 'Adicione, edite e exclua produtos do seu catálogo',
      route: '/products'
    },
    {
      icon: 'shopping_cart',
      title: 'Carrinho de Compras',
      description: 'Veja seus produtos selecionados e finalize seu pedido',
      route: '/cart'
    },
    {
      icon: 'receipt_long',
      title: 'Meus Pedidos',
      description: 'Visualize o histórico completo de seus pedidos',
      route: '/orders'
    }
  ];

  constructor(
    public supabase: SupabaseService,
    public cartService: CartService,
    private router: Router
  ) {}

  async onLogout() {
    try {
      await this.supabase.logout();
      this.router.navigate(['/login']);
    } catch (err: any) {
      alert(err.message || 'Erro ao fazer logout!');
    }
  }
}
