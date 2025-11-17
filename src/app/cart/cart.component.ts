import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/cart-item';
import { OrderConfirmationDialogComponent } from '../order-confirmation-dialog/order-confirmation-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartService = inject(CartService);
  dialog = inject(MatDialog);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  cepInput = '';
  isProcessing = false;

  get items(): CartItem[] {
    return this.cartService.cartItems();
  }

  get subtotal(): number {
    return this.cartService.subtotal();
  }

  get shippingCost(): number {
    return this.cartService.shippingCost();
  }

  get total(): number {
    return this.cartService.total();
  }

  get cep(): string {
    return this.cartService.cep();
  }

  incrementQuantity(productId: number) {
    this.cartService.incrementQuantity(productId);
  }

  decrementQuantity(productId: number) {
    this.cartService.decrementQuantity(productId);
  }

  removeItem(productId: number) {
    if (confirm('Deseja remover este item do carrinho?')) {
      this.cartService.removeItem(productId);
    }
  }

  calculateShipping() {
    if (this.cepInput.trim()) {
      this.cartService.calculateShipping(this.cepInput);
    }
  }

  openConfirmationDialog() {
    if (this.items.length === 0) {
      this.snackBar.open('Seu carrinho está vazio!', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.cep) {
      this.snackBar.open('Por favor, informe o CEP para calcular o frete.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(OrderConfirmationDialogComponent, {
      width: '600px',
      data: {
        items: this.items,
        subtotal: this.subtotal,
        shippingCost: this.shippingCost,
        total: this.total,
        cep: this.cep
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'confirm') {
        await this.finalizeOrder();
      } else if (result === 'continue') {
        this.router.navigate(['/products']);
      }
    });
  }

  async finalizeOrder() {
    this.isProcessing = true;

    try {
      // Salvar pedido no Supabase
      await this.cartService.createOrder();

      // Sucesso
      this.snackBar.open('✅ Pedido finalizado com sucesso!', 'Fechar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });

      // Limpar carrinho
      this.cartService.clearCart();
      this.cepInput = '';

      // Redirecionar para histórico de pedidos após 2 segundos
      setTimeout(() => {
        this.router.navigate(['/orders']);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      this.snackBar.open(
        `❌ Erro ao finalizar pedido: ${error.message || 'Tente novamente'}`,
        'Fechar',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.isProcessing = false;
    }
  }

  getItemTotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }
}
