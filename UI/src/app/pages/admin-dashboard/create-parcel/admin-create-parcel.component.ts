import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUser } from '../../../shared/services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-create-parcel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-parcel.component.html',
  styleUrls: ['./admin-create-parcel.component.scss']
})
export class AdminCreateParcelComponent {
  users: AdminUser[] = [];
  senderId: string = '';
  receiverId: string = '';
  receiverName: string = '';
  receiverPhone: string = '';
  pickupAddress: string = '';
  destination: string = '';
  weightCategory: string = '';
  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboardUsers().subscribe(users => {
      this.users = users.filter(u => u.status === 'active');
    });
  }

  createParcel() {
    console.log('Create Parcel called', {
      senderId: this.senderId,
      receiverId: this.receiverId,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      pickupAddress: this.pickupAddress,
      destination: this.destination,
      weightCategory: this.weightCategory
    });
    this.successMsg = '';
    this.errorMsg = '';
    if (!this.senderId || !this.receiverId || !this.receiverName || !this.receiverPhone || !this.pickupAddress || !this.destination || !this.weightCategory) {
      this.errorMsg = 'Please fill all required fields.';
      return;
    }
    this.loading = true;
    this.adminService.createParcel({
      senderId: this.senderId,
      receiverId: this.receiverId,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      pickupAddress: this.pickupAddress,
      destination: this.destination,
      weightCategory: this.weightCategory
    }).subscribe({
      next: () => {
        this.successMsg = 'Parcel created successfully!';
        this.loading = false;
        this.senderId = this.receiverId = this.receiverName = this.receiverPhone = this.pickupAddress = this.destination = this.weightCategory = '';
      },
      error: (err) => {
        this.errorMsg = 'Failed to create parcel.';
        this.loading = false;
      }
    });
  }
} 