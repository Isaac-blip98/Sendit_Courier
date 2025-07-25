import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditParcelModalComponent } from './edit-parcel-modal.component';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminParcel } from '../../../shared/services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-parcels',
  standalone: true,
  imports: [CommonModule, EditParcelModalComponent, FormsModule],
  templateUrl: './admin-parcels.component.html',
  styleUrls: ['./admin-parcels.component.scss']
})
export class AdminParcelsComponent implements OnInit {
  parcels: AdminParcel[] = [];
  filteredParcels: AdminParcel[] = [];
  isEditModalVisible = false;
  selectedParcel!: AdminParcel;
  parcelSub?: Subscription;
  parcelsChangedSub?: Subscription;

  weightFilter = '';
  statusFilter = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.fetchParcels();
    this.parcelsChangedSub = this.adminService.parcelsChanged.subscribe(() => {
      this.fetchParcels();
    });
  }

  ngOnDestroy(): void {
    this.parcelSub?.unsubscribe();
    this.parcelsChangedSub?.unsubscribe();
  }

  fetchParcels() {
    this.parcelSub = this.adminService.getParcels().subscribe((parcels: AdminParcel[]) => {
      this.parcels = parcels;
      this.applyFilters();
    });
  }

  deleteParcel(parcelId: string) {
    if (confirm('Are you sure you want to delete this parcel?')) {
      this.adminService.deleteParcel(parcelId).subscribe();
    }
  }

  editParcel(parcel: AdminParcel) {
    this.selectedParcel = { ...parcel };
    this.isEditModalVisible = true;
  }

  closeEditModal() {
    this.isEditModalVisible = false;
  }

  saveParcel(updatedParcel: AdminParcel) {
    if (updatedParcel.id) {
      this.adminService.updateParcel(updatedParcel.id, updatedParcel).subscribe(() => {
        this.closeEditModal();
      });
    } else {
      console.error('Parcel ID is missing for update.');
    }
  }

  onStatusChange(parcelId: string, newStatus: string) {
    this.adminService.updateParcel(parcelId, { status: newStatus }).subscribe();
  }

  applyFilters() {
    this.filteredParcels = this.parcels.filter(parcel => {
      const weightMatch = !this.weightFilter || parcel.weightCategory === this.weightFilter;
      const statusMatch = !this.statusFilter || parcel.status === this.statusFilter;
      return weightMatch && statusMatch;
    });
  }

  resetFilters() {
    this.weightFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }
} 