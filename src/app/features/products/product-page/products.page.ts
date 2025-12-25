import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
  allProducts = signal<Product[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal(false);
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(12);

  // Computed pagination properties
  paginatedProducts = computed(() => {
    const filtered = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage());
  });

  paginationInfo = computed(() => {
    const total = this.filteredProducts().length;
    const start = total === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), total);
    return { start, end, total };
  });

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
          this.allProducts.set(data);
          this.applyFilters();
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
    this.currentPage.set(1); // Reset to first page on category change
    // Reset search when changing category for better UX, or keep it - user preference
    // this.searchQuery.set('');
    this.loadProducts();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page on search
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allProducts()];
    
    // Apply category filter
    const category = this.selectedCategory();
    if (category && category !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Apply search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }
    
    this.filteredProducts.set(filtered);
    
    // Reset to first page if current page is beyond available pages
    const totalPages = Math.ceil(filtered.length / this.itemsPerPage());
    if (this.currentPage() > totalPages && totalPages > 0) {
      this.currentPage.set(1);
    }
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

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  }
}
