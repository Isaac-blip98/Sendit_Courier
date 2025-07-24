import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-alert',
  templateUrl: './alert.component.html',
})
export class AlertComponent {
  @Input() type: 'success' | 'error' = 'success';
  @Input() message: string = '';
  @Input() dismissible: boolean = true;

  isVisible = true;

  close() {
    this.isVisible = false;
  }
}
