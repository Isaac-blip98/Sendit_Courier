import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditParcelModalComponent } from './edit-parcel-modal.component';
import { FormsModule } from '@angular/forms';

interface Parcel {
  id: string;
  address: string;
  date: string;
  weight: string;
  status: 'Completed' | 'Picked' | 'In Transit' | 'Cancelled';
}

@Component({
  selector: 'app-admin-parcels',
  standalone: true,
  imports: [CommonModule, EditParcelModalComponent, FormsModule],
  templateUrl: './admin-parcels.component.html',
  styleUrls: ['./admin-parcels.component.scss']
})
export class AdminParcelsComponent implements OnInit {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  isEditModalVisible = false;
  selectedParcel!: Parcel;

  weightFilter = '';
  statusFilter = '';

  ngOnInit(): void {
    this.parcels = [
      {id: '00001', address: '089 Kutch Green Apt. 448', date: '04 Sep 2025', weight: 'Medium Parcel', status: 'Completed'},
      {id: '00002', address: '979 Immanuel Ferry Suite 526', date: '04 Sep 2025', weight: 'Light Parcel', status: 'Completed'},
      {id: '00003', address: '8587 Frida Ports', date: '04 Sep 2025', weight: 'Medium Parcel', status: 'Picked'},
      {id: '00004', address: '768 Destiny Lake Suite 600', date: '04 Sep 2025', weight: 'Medium Parcel', status: 'Completed'},
      {id: '00005', address: '042 Mylene Throughway', date: '04 Sep 2025', weight: 'Heavy Parcel', status: 'Completed'},
      {id: '00006', address: '543 Weinmann Mountain', date: '04 Sep 2025', weight: 'Medium Parcel', status: 'Completed'},
      {id: '00007', address: 'New Scottieberg', date: '04 Sep 2025', weight: 'Medium Parcel', status: 'Completed'},
      {id: '00008', address: 'New Jon', date: '04 Sep 2025', weight: 'Freight', status: 'In Transit'}
    ];
    this.applyFilters();
  }

  deleteParcel(parcelId: string) {
    if (confirm('Are you sure you want to delete this parcel?')) {
      this.parcels = this.parcels.filter(parcel => parcel.id !== parcelId);
      this.applyFilters();
    }
  }

  editParcel(parcel: Parcel) {
    this.selectedParcel = { ...parcel };
    this.isEditModalVisible = true;
  }

  closeEditModal() {
    this.isEditModalVisible = false;
  }

  saveParcel(updatedParcel: Parcel) {
    const index = this.parcels.findIndex(parcel => parcel.id === updatedParcel.id);
    if (index !== -1) {
      this.parcels[index] = updatedParcel;
    }
    this.closeEditModal();
  }

  onStatusChange(parcelId: string, newStatus: string) {
    console.log(`Parcel ${parcelId} status changed to ${newStatus}`);
  }

  applyFilters() {
    this.filteredParcels = this.parcels.filter(parcel => {
      const weightMatch = !this.weightFilter || parcel.weight === this.weightFilter;
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