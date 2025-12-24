import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Storage } from '../../core/utils/storage';
import { FakestoreApiService } from '../../core/api/fakestore-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage implements OnInit{
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(FakestoreApiService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }
  ngOnInit(): void {
    // Clear error message when user starts typing in username or password fields
    this.loginForm.get('username')?.valueChanges.subscribe(() => {
      if (this.loginForm.get('username')?.dirty && this.errorMessage()) {
        this.errorMessage.set('');
      }
    });

    this.loginForm.get('password')?.valueChanges.subscribe(() => {
      if (this.loginForm.get('password')?.dirty && this.errorMessage()) {
        this.errorMessage.set('');
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { username, password } = this.loginForm.value;

      // FakeStore API login endpoint
      this.api.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          const token = typeof response === 'string' ? response : response.token;
          
          if (!token) {
            this.errorMessage.set('Invalid response from server. Please try again.');
            this.isLoading.set(false);
            return;
          }
          
          // Store token and username directly as strings
          localStorage.setItem('token', token);
          localStorage.setItem('username', username);
          
          // Dispatch event to update header
          window.dispatchEvent(new Event('authUpdated'));
          
          // Check if there's a redirect destination after login
          const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
          if (redirectAfterLogin) {
            localStorage.removeItem('redirectAfterLogin');
            this.router.navigate([redirectAfterLogin]);
          } else {
            // Navigate to products page or home
            this.router.navigate(['/products']);
          }
          
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          
          // Handle error message extraction
          let message = '';
          if (typeof error.error === 'string') {
            message = error.error;
          } else if (error.error?.message) {
            message = error.error.message;
          } else {
            message = 'Username or password is incorrect';
          }
          
          this.errorMessage.set(message);
        },
      });
    } else {      
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

