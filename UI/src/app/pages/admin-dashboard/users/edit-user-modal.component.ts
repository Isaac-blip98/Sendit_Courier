import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
})
export class EditUserModalComponent {
  @Input() visible = false;
  @Input() user!: User;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<User>();

  save() {
    this.saveEvent.emit(this.user);
  }

  close() {
    this.closeEvent.emit();
  }
} 