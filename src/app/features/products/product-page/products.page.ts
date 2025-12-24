import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FakestoreApiService } from '../../../core/api/fakestore-api.service';
import { Product } from '../../../core/models/product.model';
import { Subject, takeUntil, switchMap } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss'
})
export class ProductsPage implements OnInit, OnDestroy {
  private api = inject(FakestoreApiService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private categoryChange$ = new Subject<string>();
  
  filteredProducts = signal<Product[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('all');
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadCategories();
    this.setupProductLoading();
    // Trigger initial load
    this.categoryChange$.next(this.selectedCategory());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.categoryChange$.complete();
  }

  loadCategories(): void {
    // Only load categories if not already loaded
    if (this.categories().length === 0) {
      this.api.getCategories()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: string[]) => {
            // Ensure no duplicates and proper formatting
            const uniqueCategories = [...new Set(data)];
            this.categories.set(['all', ...uniqueCategories]);
          },
          error: (error: any) => {
            const errorMessage = error?.error?.message || error?.message || 'Failed to load products. Please try again.';
          alert(errorMessage);
          }
        });
    }
  }

  setupProductLoading(): void {
    // switchMap to cancel previous requests when category changes
    this.categoryChange$
      .pipe(
        switchMap((category: string) => {
          this.isLoading.set(true);
          this.selectedCategory.set(category);
          
          const productsObservable = category === 'all' 
            ? this.api.getProducts()
            : this.api.getProductsByCategory(category);
          
          return productsObservable;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: Product[]) => {
          this.filteredProducts.set(data);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.isLoading.set(false);
          const errorMessage = error?.error?.message || error?.message || 'Failed to load products. Please try again.';
          alert(errorMessage);
        }
      });
  }

  loadProducts(): void {
    // This method is now just a trigger for the category change stream
    this.categoryChange$.next(this.selectedCategory());
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.loadProducts();
  }

  getStars(rating: number): boolean[] {
    const stars: boolean[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars || (i === fullStars && hasHalfStar));
    }
    return stars;
  }

  addToCart(product: Product): void {
    // For now, store in localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": []}');
    const existingItem = cart.items.find((item: any) => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger cart count update (you might want to use a service for this)
    window.dispatchEvent(new Event('cartUpdated'));
  }
}
