import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { AuthService, User } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  isDropdownOpen = false;

  constructor(
    private modalService: ModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }

  openLogin() {
    this.modalService.openLogin();
  }

  openRegister() {
    this.modalService.openRegister();
  }

  logout() {
    this.authService.logout();
    this.isDropdownOpen = false;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
}
