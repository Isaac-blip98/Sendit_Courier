import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
} from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['role'] as string | string[];
    const user = this.auth.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowed = Array.isArray(expectedRoles)
      ? expectedRoles.includes(user.role)
      : user.role === expectedRoles;

    if (!allowed) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
