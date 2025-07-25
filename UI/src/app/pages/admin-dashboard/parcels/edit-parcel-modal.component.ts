import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminParcel } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-edit-parcel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-parcel-modal.component.html',
})
export class EditParcelModalComponent {
  @Input() visible = false;
  @Input() parcel!: AdminParcel;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<AdminParcel>();

  save() {
    this.saveEvent.emit(this.parcel);
  }

  close() {
    this.closeEvent.emit();
  }
} 