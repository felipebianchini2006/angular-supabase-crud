import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CartItem } from '../models/cart-item';

interface DialogData {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  cep: string;
}

@Component({
  selector: 'app-order-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './order-confirmation-dialog.component.html',
  styleUrl: './order-confirmation-dialog.component.css'
})
export class OrderConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  getItemTotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  onContinue(): void {
    this.dialogRef.close('continue');
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}
