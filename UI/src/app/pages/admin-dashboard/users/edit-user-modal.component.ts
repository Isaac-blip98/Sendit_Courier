import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUser } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
})
export class EditUserModalComponent {
  @Input() visible = false;
  @Input() user!: AdminUser;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<AdminUser>();

  save() {
    this.saveEvent.emit(this.user);
  }

  close() {
    this.closeEvent.emit();
  }
} 