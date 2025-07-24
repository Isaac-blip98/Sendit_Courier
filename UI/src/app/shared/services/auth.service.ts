import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

export interface User {
  email: string;
  role: 'admin' | 'customer';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private readonly API_URL = 'http://localhost:3000/auth'; 

  constructor(private http: HttpClient, private router: Router) {
    const savedUser = localStorage.getItem('user');
    try {
      if (savedUser && savedUser !== 'undefined') {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      localStorage.removeItem('user'); 
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap((res) => {
          const { access_token, user } = res;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, data).pipe(
      tap((res) => {
        const { access_token } = res;
        const decoded: any = jwtDecode(access_token);

        const user = {
          email: decoded.email,
          role: decoded.role,
        };

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
