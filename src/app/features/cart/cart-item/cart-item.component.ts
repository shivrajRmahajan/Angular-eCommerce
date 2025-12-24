import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent {
  @Input() item!: CartItem;
  @Output() quantityChange = new EventEmitter<{ item: CartItem; quantity: number }>();
  @Output() delete = new EventEmitter<CartItem>();

  onQuantityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    
    if (newQuantity > 0) {
      this.quantityChange.emit({ item: this.item, quantity: newQuantity });
    } else {
      // Reset to 1 if invalid quantity
      input.value = '1';
    }
  }

  onDelete(): void {
    this.delete.emit(this.item);
  }
}

