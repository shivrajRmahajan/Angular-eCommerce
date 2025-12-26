import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FakestoreApiService } from './fakestore-api.service';

describe('FakestoreApiService', () => {
  let service: FakestoreApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://fakestoreapi.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FakestoreApiService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(FakestoreApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should make a POST request to login endpoint', () => {
      const loginData = { username: 'testuser', password: 'testpass' };
      const mockResponse = { token: 'test-token-123' };

      service.login(loginData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockResponse);
    });

    it('should handle string token response', () => {
      const loginData = { username: 'testuser', password: 'testpass' };
      const mockResponse = 'test-token-string';

      service.login(loginData).subscribe(response => {
        expect(response).toBe(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/auth/login`);
      req.flush(mockResponse);
    });
  });

  describe('getProducts', () => {
    it('should make a GET request to products endpoint', () => {
      const mockProducts = [
        {
          id: 1,
          title: 'Test Product',
          price: 29.99,
          description: 'Test Description',
          category: 'electronics',
          image: 'test.jpg'
        },
        {
          id: 2,
          title: 'Another Product',
          price: 49.99,
          description: 'Another Description',
          category: 'clothing',
          image: 'test2.jpg'
        }
      ];

      service.getProducts().subscribe(products => {
        expect(products.length).toBe(2);
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(`${baseUrl}/products`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should return empty array when no products', () => {
      service.getProducts().subscribe(products => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/products`);
      req.flush([]);
    });
  });

  describe('getProductsByCategory', () => {
    it('should make a GET request to category endpoint with correct category', () => {
      const category = 'electronics';
      const mockProducts = [
        {
          id: 1,
          title: 'Electronics Product',
          price: 99.99,
          description: 'Electronics Description',
          category: 'electronics',
          image: 'electronics.jpg'
        }
      ];

      service.getProductsByCategory(category).subscribe(products => {
        expect(products).toEqual(mockProducts);
        expect(products[0].category).toBe(category);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/category/${category}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should handle different categories', () => {
      const category = 'clothing';
      const mockProducts = [
        {
          id: 2,
          title: 'Clothing Product',
          price: 49.99,
          description: 'Clothing Description',
          category: 'clothing',
          image: 'clothing.jpg'
        }
      ];

      service.getProductsByCategory(category).subscribe(products => {
        expect(products[0].category).toBe(category);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/category/${category}`);
      req.flush(mockProducts);
    });
  });

  describe('getCategories', () => {
    it('should make a GET request to categories endpoint', () => {
      const mockCategories = ['electronics', 'jewelry', 'men\'s clothing', 'women\'s clothing'];

      service.getCategories().subscribe(categories => {
        expect(categories.length).toBe(4);
        expect(categories).toEqual(mockCategories);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });

    it('should return empty array when no categories', () => {
      service.getCategories().subscribe(categories => {
        expect(categories).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/categories`);
      req.flush([]);
    });
  });

  describe('getProductById', () => {
    it('should make a GET request to product by id endpoint', () => {
      const productId = 1;
      const mockProduct = {
        id: productId,
        title: 'Test Product',
        price: 29.99,
        description: 'Test Description',
        category: 'electronics',
        image: 'test.jpg',
        rating: {
          rate: 4.5,
          count: 120
        }
      };

      service.getProductById(productId).subscribe(product => {
        expect(product).toEqual(mockProduct);
        expect(product.id).toBe(productId);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/${productId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });

    it('should handle different product IDs', () => {
      const productId = 5;
      const mockProduct = {
        id: productId,
        title: 'Product 5',
        price: 59.99,
        description: 'Description 5',
        category: 'clothing',
        image: 'product5.jpg'
      };

      service.getProductById(productId).subscribe(product => {
        expect(product.id).toBe(productId);
      });

      const req = httpMock.expectOne(`${baseUrl}/products/${productId}`);
      req.flush(mockProduct);
    });
  });
});

