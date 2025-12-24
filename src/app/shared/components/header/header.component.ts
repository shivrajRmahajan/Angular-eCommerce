import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartItemCount = signal(0);
  username = signal<string | null>(null);
  isLoggedIn = signal(false);
  private cartUpdateListener?: () => void;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load cart count from localStorage or service
    this.loadCartCount();
    
    // Check if user is logged in
    this.checkAuthStatus();
    
    // Listen for cart updates
    this.cartUpdateListener = () => {
      this.loadCartCount();
    };
    window.addEventListener('cartUpdated', this.cartUpdateListener);
    
    // Listen for auth updates (when user logs in/out)
    window.addEventListener('authUpdated', () => {
      this.checkAuthStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
  }

  loadCartCount(): void {
    // TODO: Load from cart service
    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const cartData = JSON.parse(cart);
        const count = cartData.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        this.cartItemCount.set(count);
      } catch (e) {
        this.cartItemCount.set(0);
      }
    } else {
      this.cartItemCount.set(0);
    }
  }

  checkAuthStatus(): void {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      this.isLoggedIn.set(true);
      this.username.set(username);
    } else {
      this.isLoggedIn.set(false);
      this.username.set(null);
    }
  }

  onUserClick(): void {
    // TODO: Navigate to user profile or login
    const token = localStorage.getItem('token');
    if (token) {
      // Navigate to profile
      console.log('Navigate to profile');
    } else {
      this.router.navigate(['/login']);
    }
  }

  onSearchClick(): void {
    // TODO: Open search modal or navigate to search page
    console.log('Search clicked');
  }

  onWishlistClick(): void {
    // TODO: Navigate to wishlist page
    console.log('Wishlist clicked');
  }

  onCartClick(): void {
    this.router.navigate(['/cart']);
  }
}

