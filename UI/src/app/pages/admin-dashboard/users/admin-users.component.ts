import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditUserModalComponent } from './edit-user-modal.component';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, EditUserModalComponent, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  isEditModalVisible = false;
  selectedUser!: AdminUser;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboardUsers().subscribe((users: AdminUser[]) => {
      this.users = users;
    });
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.id !== userId);
        },
        error: () => alert('Failed to delete user')
      });
    }
  }

  editUser(user: AdminUser) {
    this.selectedUser = { ...user };
    this.isEditModalVisible = true;
  }

  closeEditModal() {
    this.isEditModalVisible = false;
  }

  saveUser(updatedUser: AdminUser) {
    // Only send allowed fields to the backend
    const payload: any = {
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profileImage: updatedUser.profileImage,
      deletedAt: updatedUser.deletedAt,
    };
    this.adminService.updateUser(updatedUser.id, payload).subscribe({
      next: (user) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) this.users[index] = user;
        this.closeEditModal();
      },
      error: () => alert('Failed to update user')
    });
  }

  onStatusChange(userId: string, newStatus: 'active' | 'inactive') {
    const payload = newStatus === 'inactive'
      ? { deletedAt: new Date() }
      : { deletedAt: null };
    this.adminService.updateUser(userId, payload).subscribe({
      next: (user) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) this.users[index] = user;
      },
      error: () => alert('Failed to update status')
    });
  }
} 