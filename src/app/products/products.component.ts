import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../services/supabase.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product';
import { ProductDialogComponent } from '../product-dialog/product-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatBadgeModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  displayedColumns: string[] = ['image', 'name', 'description', 'price', 'actions'];
  supabaseService = inject(SupabaseService);
  cartService = inject(CartService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.supabaseService.loadProducts();
  }

  get products(): Product[] {
    return this.supabaseService.products();
  }

  openDialog(product?: Product) {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '500px',
      data: { product: product ? { ...product } : { name: '', description: '', price: 0, imageUrl: '' } }
    });

    dialogRef.afterClosed().subscribe((result: Product) => {
      if (result) {
        if (product?.id) {
          this.supabaseService.updateProduct(product.id, result);
        } else {
          this.supabaseService.addProduct({
            ...result,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  }

  deleteProduct(id: number) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.supabaseService.deleteProduct(id);
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/60?text=Sem+Imagem';
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    this.snackBar.open('Produto adicionado ao carrinho!', 'Fechar', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
