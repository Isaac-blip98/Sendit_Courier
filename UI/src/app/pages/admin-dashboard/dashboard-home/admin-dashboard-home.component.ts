import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Parcel {
  orderNumber: string;
  date: string;
  customer: string;
  time: string;
  destination: string;
  pickupLocation: string;
}

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

  customerNameFilter = '';
  orderNumberFilter = '';
  pickupLocationFilter = '';
  destinationFilter = '';

  ngOnInit(): void {
    this.parcels = [
      { orderNumber: '#AHGA68', date: '23/09/2022', customer: 'Jacob Marcus', time: '2.00 pm', destination: '342 Onan road, Uyo', pickupLocation: '342 Onan road, Uyo' },
      { orderNumber: '#AHGA69', date: '24/09/2022', customer: 'Sarah Johnson', time: '11.00 am', destination: '123 Main St, Anytown', pickupLocation: '456 Oak Ave, Anytown' },
      { orderNumber: '#AHGA70', date: '25/09/2022', customer: 'Mike Williams', time: '3.30 pm', destination: '789 Pine Ln, Sometown', pickupLocation: '101 Maple Dr, Sometown' },
      { orderNumber: '#AHGA71', date: '26/09/2022', customer: 'Emily Brown', time: '9.00 am', destination: '210 Birch Rd, Othertown', pickupLocation: '314 Elm St, Othertown' },
      { orderNumber: '#AHGA72', date: '27/09/2022', customer: 'David Jones', time: '5.00 pm', destination: '555 Cedar Ct, Anothertown', pickupLocation: '666 Spruce Way, Anothertown' }
    ];
    this.applyFilters();
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