import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditUserModalComponent } from './edit-user-modal.component';
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
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, EditUserModalComponent, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  isEditModalVisible = false;
  selectedUser!: User;

  ngOnInit(): void {
    this.users = [
      { id: 1, name: 'John Doe', email: 'john.doe@example.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', joinedDate: '2024-07-01', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', joinedDate: '2024-07-02', status: 'inactive' },
      { id: 3, name: 'Sam Wilson', email: 'sam.wilson@example.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', joinedDate: '2024-07-03', status: 'inactive' },
      { id: 4, name: 'Alice Johnson', email: 'alice.johnson@example.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', joinedDate: '2024-07-04', status: 'active' },
      { id: 5, name: 'Mike Brown', email: 'mike.brown@example.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d', joinedDate: '2024-07-05', status: 'active' }
    ];
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(user => user.id !== userId);
    }
  }

  editUser(user: User) {
    this.selectedUser = { ...user };
    this.isEditModalVisible = true;
  }

  closeEditModal() {
    this.isEditModalVisible = false;
  }

  saveUser(updatedUser: User) {
    const index = this.users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = updatedUser;
    }
    this.closeEditModal();
  }

  onStatusChange(userId: number, newStatus: string) {
    console.log(`User ${userId} status changed to ${newStatus}`);
  }
} 