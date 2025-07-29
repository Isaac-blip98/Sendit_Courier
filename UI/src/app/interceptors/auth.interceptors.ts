import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  req = req.clone({
    withCredentials: true, 
    setHeaders: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/']);
      }

      if (error.status === 403) {
        console.error('Access forbidden:', error);
      }

      return throwError(() => error);
    })
  );
};
