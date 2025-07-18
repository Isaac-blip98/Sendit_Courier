import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent implements OnInit {
  visible$!: Observable<boolean>;

  constructor(public modalService: ModalService) {}

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
}
