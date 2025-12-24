import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, CartItemComponent],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss'
})
export class CartPage implements OnInit, OnDestroy {
  private router = inject(Router);
  items = signal<CartItem[]>([]);

  subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + (i.product.price * i.quantity), 0)
  );

  total = computed(() => this.subtotal());

  private cartUpdateListener?: () => void;

  ngOnInit(): void {
    this.loadCart();
    
    // Listen for cart updates from other pages
    this.cartUpdateListener = () => {
      this.loadCart();
    };
    window.addEventListener('cartUpdated', this.cartUpdateListener);
  }

  ngOnDestroy(): void {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
  }

  loadCart(): void {
    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const cartData = JSON.parse(cart);
        this.items.set(cartData.items || []);
      } catch (e) {
        console.error('Error loading cart:', e);
        this.items.set([]);
      }
    }
  }

  saveCart(): void {
    const cart = {
      items: this.items(),
      total: this.total()
    };
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  updateQuantity(event: { item: CartItem; quantity: number }): void {
    const updatedItems = this.items().map(item => 
      item.product.id === event.item.product.id
        ? { ...item, quantity: event.quantity }
        : item
    );
    this.items.set(updatedItems);
    this.saveCart();
  }

  removeItem(item: CartItem): void {
    const updatedItems = this.items().filter(
      i => i.product.id !== item.product.id
    );
    this.items.set(updatedItems);
    this.saveCart();
  }

  onCheckout(): void {
    // Check if user is logged in before allowing checkout
    const token = localStorage.getItem('token');
    if (!token) {
      // Store the intended destination (checkout) to redirect after login
      localStorage.setItem('redirectAfterLogin', '/checkout');
      alert('Please login to proceed to checkout');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/checkout']);
  }
}

