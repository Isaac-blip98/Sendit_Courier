import { Component, OnInit } from '@angular/core';
import {
  CustomerService,
  Parcel,
  ParcelStats,
} from '../../shared/services/customer.service';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
})
export class CustomerDashboardComponent implements OnInit {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  selectedView: 'sent' | 'received' = 'sent';
  selectedStatus: string = 'all';
  searchQuery: string = '';
  currentUserId: string = '';

  // Statistics
  stats: ParcelStats = {
    totalParcels: 0,
    totalSent: 0,
    totalReceived: 0,
    statusCounts: {
      all: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0,
    },
  };

  loading = false;
  error: string | null = null;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.id) {
      this.currentUserId = user.id;
      this.loadParcels();
    } else {
      console.error(' No user ID found');
      this.error = 'User not authenticated. Please log in again.';
    }
  }

  loadParcels(): void {
    if (!this.currentUserId) {
      console.error(' No currentUserId available');
      return;
    }

    this.loading = true;
    this.error = null;


    // Use the endpoint that returns both sent and received parcels
    this.customerService.getUserParcels(this.currentUserId).subscribe({
      next: (parcels) => {

        this.parcels = parcels || [];
        this.stats = this.customerService.calculateStats(
          this.parcels,
          this.currentUserId
        );

        this.applyFilters();
        this.loading = false;

      },
      error: (err: HttpErrorResponse) => {
        console.error(' Failed to load parcels:', err);
        console.error(' Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url,
        })

        this.error = `Failed to load parcels: ${err.status} ${
          err.statusText || err.message
        }`;
        this.loading = false;

        // Additional debugging for auth token
        const token = this.authService.getToken();
        if (token) {
        }
      },
    });
  }

  switchTab(tab: 'sent' | 'received'): void {
    this.selectedView = tab;
    this.selectedStatus = 'all'; // Reset status filter when switching tabs
    this.applyFilters();
  }

  switchStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.parcels];

    // Filter by view (sent/received)
    if (this.selectedView === 'sent') {
      filtered = filtered.filter((p) => p.senderId === this.currentUserId);
    } else {
      filtered = filtered.filter((p) => p.receiverId === this.currentUserId);
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      const statusMap = {
        pending: 'PENDING',
        inTransit: 'IN_TRANSIT',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
      };

      const mappedStatus =
        statusMap[this.selectedStatus as keyof typeof statusMap];
      if (mappedStatus) {
        filtered = filtered.filter((p) => p.status === mappedStatus);
      }
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(query) ||
          p.receiverName.toLowerCase().includes(query) ||
          p.pickupAddress.toLowerCase().includes(query) ||
          p.destination.toLowerCase().includes(query)
      );
    }

    this.filteredParcels = filtered;
  }

  getStatusBadgeClass(status: Parcel['status']): string {
    const baseClass =
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full';

    switch (status) {
      case 'IN_TRANSIT':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'PENDING':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'DELIVERED':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'CANCELLED':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getTabClass(tab: 'sent' | 'received'): string {
    const baseClass =
      'px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2';

    if (this.selectedView === tab) {
      return `${baseClass} bg-blue-600 text-white focus:ring-blue-400`;
    }
    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300`;
  }

  getStatusButtonClass(status: string): string {
    const baseClass = 'px-2 py-1 focus:outline-none whitespace-nowrap';

    if (this.selectedStatus === status) {
      return `${baseClass} text-blue-600 border-b-2 border-blue-600 font-semibold`;
    }
    return `${baseClass} text-gray-500 hover:text-blue-600`;
  }

  formatWeight(weightCategory: string): string {
    return this.customerService.formatWeight(weightCategory);
  }

  getDisplayStatus(status: string): string {
    return this.customerService.getDisplayStatus(status);
  }

  trackByParcelId(index: number, parcel: Parcel): string {
    return parcel.id;
  }

  // Helper method to get current view's status counts
  getCurrentViewStatusCounts() {
    const currentParcels =
      this.selectedView === 'sent'
        ? this.parcels.filter((p) => p.senderId === this.currentUserId)
        : this.parcels.filter((p) => p.receiverId === this.currentUserId);

    const counts = {
      all: currentParcels.length,
      pending: currentParcels.filter((p) => p.status === 'PENDING').length,
      inTransit: currentParcels.filter((p) => p.status === 'IN_TRANSIT').length,
      delivered: currentParcels.filter((p) => p.status === 'DELIVERED').length,
      cancelled: currentParcels.filter((p) => p.status === 'CANCELLED').length,
    };

    return counts;
  }
}
