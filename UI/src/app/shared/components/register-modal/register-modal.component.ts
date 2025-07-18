import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html'
})
export class RegisterModalComponent implements OnInit {
  visible$!: Observable<boolean>;

  constructor(public modalService: ModalService) {}

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
}
