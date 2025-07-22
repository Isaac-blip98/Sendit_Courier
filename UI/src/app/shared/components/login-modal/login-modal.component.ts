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

  constructor(
    public modalService: ModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.visible$ = this.modalService.login$;
  }

  close() {
    this.modalService.closeAll();
  }

  switchToRegister(event: Event) {
    event.preventDefault();
    this.modalService.openRegister();
  }

  handleLogin() {
    if (this.email === 'admin@sendit.com') {
      this.authService.login(this.email, 'admin');
    } else {
      this.authService.login(this.email, 'customer');
    }
    this.modalService.closeAll();
  }
}
