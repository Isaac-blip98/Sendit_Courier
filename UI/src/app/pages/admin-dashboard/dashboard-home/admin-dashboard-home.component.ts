import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Parcel, DashboardStats } from '../../../shared/services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard-home.component.html',
  styleUrls: ['./admin-dashboard-home.component.scss'],
})
export class AdminDashboardHomeComponent implements OnInit {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  stats: DashboardStats | null = null;
  private statsSub?: Subscription;

  customerNameFilter = '';
  orderNumberFilter = '';
  pickupLocationFilter = '';
  destinationFilter = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboardParcels().subscribe((parcels: Parcel[]) => {
      this.parcels = parcels;
      this.applyFilters();
    });
    this.fetchStats();
    this.statsSub = this.adminService.statsChanged.subscribe(() => {
      this.fetchStats();
    });
  }

  fetchStats() {
    this.adminService.getDashboardStats().subscribe((stats: DashboardStats) => {
      this.stats = stats;
    });
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
  }

  applyFilters() {
    this.filteredParcels = this.parcels.filter(parcel =>
      parcel.customer.toLowerCase().includes(this.customerNameFilter.toLowerCase()) &&
      parcel.orderNumber.toLowerCase().includes(this.orderNumberFilter.toLowerCase()) &&
      parcel.pickupLocation.toLowerCase().includes(this.pickupLocationFilter.toLowerCase()) &&
      parcel.destination.toLowerCase().includes(this.destinationFilter.toLowerCase())
    );
  }
} 