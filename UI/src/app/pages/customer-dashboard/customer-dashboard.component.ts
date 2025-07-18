import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Parcel {
  orderId: string;
  packageName: string;
  date: string;
  status: 'processing' | 'transit' | 'delivered' | 'cancelled';
  location: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'] // or .scss if preferred
})
export class CustomerDashboardComponent implements OnInit {
  activeOrderId = 'YB-2024-001234';
  selectedView: 'history' | 'incoming' = 'history';

  parcels: Parcel[] = [];

  ngOnInit(): void {
    // Mock data - Replace with real API call later
    this.parcels = [
      {
        orderId: 'YB-001234',
        packageName: 'Package from John Doe',
        date: 'Jul 17, 2024',
        status: 'transit',
        location: 'Oak Avenue',
      },
      {
        orderId: 'YB-001233',
        packageName: 'Electronics package',
        date: 'Jul 16, 2024',
        status: 'delivered',
        location: 'Main Street',
      },
      {
        orderId: 'YB-001232',
        packageName: 'Document envelope',
        date: 'Jul 15, 2024',
        status: 'delivered',
        location: 'Commerce Drive',
      },
      {
        orderId: 'YB-001231',
        packageName: 'Books package',
        date: 'Jul 14, 2024',
        status: 'processing',
        location: 'Distribution Center',
      },
      {
        orderId: 'YB-001230',
        packageName: 'Clothing package',
        date: 'Jul 13, 2024',
        status: 'delivered',
        location: 'Pine Street',
      },
      {
        orderId: 'YB-001229',
        packageName: 'Gift package',
        date: 'Jul 12, 2024',
        status: 'cancelled',
        location: '--',
      }
    ];
  }

  viewDetails(orderId: string) {
    console.log('View details for:', orderId);
    // TODO: Navigate to parcel details or open modal
  }

  switchView(view: 'history' | 'incoming') {
    this.selectedView = view;
    // TODO: Filter or fetch relevant data based on view
  }

  getStatusBadgeClass(status: Parcel['status']) {
    switch (status) {
      case 'transit':
        return 'status-badge status-transit';
      case 'processing':
        return 'status-badge status-processing';
      case 'delivered':
        return 'status-badge status-delivered';
      case 'cancelled':
        return 'status-badge status-cancelled';
      default:
        return '';
    }
  }
}
