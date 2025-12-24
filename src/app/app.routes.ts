import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-page/products.page').then(m => m.ProductsPage)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/Product-details-page/product-details.page').then(m => m.ProductDetailsPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-page/cart.page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.page').then(m => m.CheckoutPage),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
