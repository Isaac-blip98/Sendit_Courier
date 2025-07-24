import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
})
export class RegisterModalComponent implements OnInit {
  visible$!: Observable<boolean>;
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  registerError = '';

  constructor(
    public modalService: ModalService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.visible$ = this.modalService.register$;
  }

  close() {
    this.registerError = '';
    this.modalService.closeAll();
  }

  switchToLogin(event: Event) {
    event.preventDefault();
    this.modalService.openLogin();
  }

  handleRegister() {
    if (this.password !== this.confirmPassword) {
      this.registerError = 'Passwords do not match';
      return;
    }

    this.authService
      .register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.registerError = '';
          this.alertService.showSuccess(
            'Registration successful! Please login.'
          );
          this.modalService.openLogin(); 
        },
        error: (err) => {
          this.registerError = err.error?.message || 'Registration failed';
          this.alertService.showError(this.registerError);
        },
      });
  }
}
