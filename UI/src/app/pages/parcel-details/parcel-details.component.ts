import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-parcel-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parcel-details.component.html',
  styleUrls: ['./parcel-details.component.scss']
})
export class ParcelDetailsComponent implements OnInit {
  orderId: string | null = null;

  // Status stepper data
  statuses = [
    { key: 'created', label: 'Created', icon: 'check' },
    { key: 'in_transit', label: 'In Transit', icon: 'truck' },
    { key: 'delivered', label: 'Delivered', icon: 'box' }
  ];
  currentStatus: 'created' | 'in_transit' | 'delivered' = 'in_transit';

  get currentStatusIndex(): number {
    return this.statuses.findIndex(s => s.key === this.currentStatus);
  }

  constructor(private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    // Use orderId to fetch data from service or state
  }

  goBack() {
    this.location.back();
  }
}
