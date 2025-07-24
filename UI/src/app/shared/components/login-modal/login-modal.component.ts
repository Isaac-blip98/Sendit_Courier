import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
})
export class LoginModalComponent implements OnInit {
  visible$!: Observable<boolean>;
  email = '';
  password = '';

  loginError: string | null = null;

  constructor(
    public modalService: ModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.visible$ = this.modalService.login$;
  }

  close() {
    this.loginError = null; 
    this.modalService.closeAll();
  }

  switchToRegister(event: Event) {
    event.preventDefault();
    this.loginError = null; 
    this.modalService.openRegister();
  }

  handleLogin() {
    this.loginError = null; 
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.modalService.closeAll();
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }
}
