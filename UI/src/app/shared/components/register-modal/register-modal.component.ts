import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
})
export class RegisterModalComponent implements OnInit {
  visible$!: Observable<boolean>;
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';

  constructor(
    public modalService: ModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.visible$ = this.modalService.register$;
  }

  close() {
    this.modalService.closeAll();
  }

  switchToLogin(event: Event) {
    event.preventDefault();
    this.modalService.openLogin();
  }

  handleRegister() {
    // For mock purposes, we'll just log in the user as a customer
    this.authService.login(this.email, 'customer');
    this.modalService.closeAll();
  }
}
