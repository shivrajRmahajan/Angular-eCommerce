import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FakestoreApiService } from '../../../core/api/fakestore-api.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './product-details.page.html',
  styleUrl: './product-details.page.scss'
})
export class ProductDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(FakestoreApiService);

  product = signal<Product | null>(null);
  isLoading = signal(false);
  selectedImage = signal<string>('');
  selectedSize = signal<string>('L');
  selectedColor = signal<string>('gold');
  quantity = signal<number>(1);

  // Mock data for sizes and colors (since FakeStore API doesn't provide these)
  sizes = ['L', 'XL', 'XS'];
  colors = [
    { name: 'purple', value: '#9B59B6' },
    { name: 'black', value: '#000000' },
    { name: 'gold', value: '#B88E2F' }
  ];

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(parseInt(productId, 10));
    }
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);
    this.api.getProductById(id).subscribe({
      next: (data: Product) => {
        this.product.set(data);
        this.selectedImage.set(data.image);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading product:', error);
        this.isLoading.set(false);
        alert('Failed to load product. Please try again.');
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  increaseQuantity(): void {
    this.quantity.set(this.quantity() + 1);
  }

  onQuantityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (value > 0) {
      this.quantity.set(value);
    } else {
      this.quantity.set(1);
      input.value = '1';
    }
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": []}');
    const existingItem = cart.items.find((item: any) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += this.quantity();
    } else {
      cart.items.push({ 
        product, 
        quantity: this.quantity(),
        size: this.selectedSize(),
        color: this.selectedColor()
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert('Product added to cart!');
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

  getThumbnailImages(): string[] {
    const product = this.product();
    if (!product) return [];
    
    // For FakeStore API, we'll use the same image multiple times
    // In a real app, you'd have multiple product images
    return [product.image, product.image, product.image, product.image];
  }
}
