import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CartItem } from '../../core/models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss'
})
export class CheckoutPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);

  items = signal<CartItem[]>([]);
  checkoutForm: FormGroup;
  isSubmitting = signal(false);

  subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + (i.product.price * i.quantity), 0)
  );

  total = computed(() => this.subtotal());

  private cartUpdateListener?: () => void;

  constructor() {
    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      companyName: [''],
      country: ['India', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: [''],
      additionalInfo: [''],
      paymentMethod: ['directBankTransfer', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCart();
    
    // Redirect if cart is empty
    if (this.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Listen for cart updates
    this.cartUpdateListener = () => {
      this.loadCart();
      if (this.items().length === 0) {
        this.router.navigate(['/cart']);
      }
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

  get firstName() { return this.checkoutForm.get('firstName'); }
  get lastName() { return this.checkoutForm.get('lastName'); }
  get companyName() { return this.checkoutForm.get('companyName'); }
  get email() { return this.checkoutForm.get('email'); }
  get phone() { return this.checkoutForm.get('phone'); }
  get address() { return this.checkoutForm.get('address'); }
  get city() { return this.checkoutForm.get('city'); }
  get state() { return this.checkoutForm.get('state'); }
  get zipCode() { return this.checkoutForm.get('zipCode'); }
  get country() { return this.checkoutForm.get('country'); }
  get additionalInfo() { return this.checkoutForm.get('additionalInfo'); }
  get paymentMethod() { return this.checkoutForm.get('paymentMethod'); }


  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // Simulate order processing
    // setTimeout(() => {
      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Store order (optional - for order history)
      const order = {
        id: Date.now(),
        items: this.items(),
        total: this.total(),
        shippingAddress: {
          firstName: this.firstName?.value,
          lastName: this.lastName?.value,
          companyName: this.companyName?.value,
          email: this.email?.value,
          phone: this.phone?.value,
          address: this.address?.value,
          city: this.city?.value,
          state: this.state?.value,
          zipCode: this.zipCode?.value,
          country: this.country?.value,
          additionalInfo: this.additionalInfo?.value
        },
        paymentMethod: this.paymentMethod?.value,
        date: new Date().toISOString()
      };

      // Redirect to success page or products page
      alert('Order placed successfully! Your order ID is: ' + order.id);
      this.router.navigate(['/products']);
      this.isSubmitting.set(false);
    // }, 1500);
  }
}

