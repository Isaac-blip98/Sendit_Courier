import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environment/environment';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer' | 'courier';
  name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  // Use environment variable instead of hardcoded URL
  private readonly API_URL = `${environment.apiUrl}/auth`;

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
          const { access_token, role } = res;

          localStorage.setItem('access_token', access_token);

          let user: User | null = null;
          if (access_token) {
            try {
              const decoded: any = jwtDecode(access_token);
              user = {
                id: decoded.sub,
                email: decoded.email,
                role: decoded.role?.toLowerCase(),
              };
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
            } catch (e) {
              console.error('Token decode failed:', e);
            }
          }

          if (user?.role === 'courier') {
            this.router.navigate(['/courier-dashboard']);
          } else if (user?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/customer-dashboard']);
          }
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
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role ? decoded.role.toLowerCase() : undefined,
          name: decoded.name,
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

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  getCourierId(): string | null {
    const user = this.getUser();
    return user?.role === 'courier' ? user.id : null;
  }
}