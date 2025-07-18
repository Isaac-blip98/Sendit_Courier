import { Component } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private modalService: ModalService) {}

  openLogin() {
    this.modalService.openLogin();
  }

  openRegister() {
    this.modalService.openRegister();
  }
}
