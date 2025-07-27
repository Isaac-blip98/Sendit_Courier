import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { CustomerService, Parcel } from '../../shared/services/customer.service'; 
import * as L from 'leaflet';

@Component({
  selector: 'app-parcel-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parcel-details.component.html',
  styleUrls: ['./parcel-details.component.scss']
})
export class ParcelDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  orderId: string | null = null;
  parcel: Parcel | null = null;
  loading = false;
  error: string | null = null;

  map!: L.Map;
  mapInitialized = false;
  shouldInitializeMap = false;

  statuses = [
    { key: 'PENDING', label: 'Pending', icon: 'clock' },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: 'truck' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'check' }
  ];

  currentStatus: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' = 'PENDING';

  get currentStatusIndex(): number {
    if (this.currentStatus === 'CANCELLED') {
      return -1;
    }
    return this.statuses.findIndex(s => s.key === this.currentStatus);
  }

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {
    // Fix Leaflet default markers issue
    this.fixLeafletIcons();
  }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (this.orderId) {
      this.loadParcelDetails();
    }
  }

  ngAfterViewInit(): void {
    // Initialize map if data is already loaded and map container exists
    if (this.shouldInitializeMap && this.mapContainer) {
      this.loadMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIcons(): void {
    // Fix for Leaflet default markers not showing
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }

  loadParcelDetails(): void {
    if (!this.orderId) return;

    this.loading = true;
    this.error = null;

    this.customerService.getParcelById(this.orderId).subscribe({
      next: (parcel) => {
        this.parcel = parcel;
        this.currentStatus = parcel.status;
        this.loading = false;
        this.shouldInitializeMap = true;

        // Check if coordinates exist
        if (parcel.pickupLat && parcel.pickupLng && parcel.destinationLat && parcel.destinationLng) {
          
          // Wait for Angular to render the DOM elements
          this.waitForMapContainer();
        } else {
          console.error('Missing coordinates in parcel data');
        }
      },
      error: (err) => {
        console.error('Failed to load parcel details', err);
        this.error = 'Failed to load parcel details. Please try again.';
        this.loading = false;
      }
    });
  }

  private waitForMapContainer(retryCount: number = 0): void {
    const maxRetries = 50; 
    
    // Force change detection to ensure DOM is updated
    this.cdr.detectChanges();
    
    // Check if map container is available, if not, wait and try again
    const checkContainer = () => {
      if (this.mapContainer?.nativeElement) {
        setTimeout(() => this.loadMap(), 100);
      } else if (retryCount < maxRetries) {
        setTimeout(() => this.waitForMapContainer(retryCount + 1), 50);
      } else {
        console.error('Map container failed to load after maximum retries');
        // Fallback: try one more time with a longer delay
        setTimeout(() => {
          if (this.mapContainer?.nativeElement) {
            this.loadMap();
          }
        }, 1000);
      }
    };
    
    // Start checking after Angular change detection cycle
    setTimeout(checkContainer, 0);
  }

  loadMap(): void {
    
    // Check if all conditions are met before initializing
    if (this.mapInitialized) {
      return;
    }

    if (!this.parcel?.pickupLat || !this.parcel?.destinationLat) {
      return;
    }

    if (!this.mapContainer?.nativeElement) {
      return;
    }

    try {
      this.mapInitialized = true;

      const mapElement = this.mapContainer.nativeElement;
      // Initialize the map using the ViewChild reference
      this.map = L.map(mapElement, {
        center: [this.parcel.pickupLat, this.parcel.pickupLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });
      
      tileLayer.addTo(this.map);
      // Add markers
      const pickupMarker = L.marker([this.parcel.pickupLat, this.parcel.pickupLng])
        .addTo(this.map)
        .bindPopup('📦 Pickup Location');

      const destinationMarker = L.marker([this.parcel.destinationLat, this.parcel.destinationLng])
        .addTo(this.map)
        .bindPopup('🏁 Destination');

      const group = L.featureGroup([pickupMarker, destinationMarker]);
      this.map.fitBounds(group.getBounds(), { 
        padding: [20, 20],
        maxZoom: 15
      });

      // Force map resize and invalidation
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize();
            }
          }, 500);
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      this.mapInitialized = false;
    }
  }

  goBack(): void {
    this.location.back();
  }

  getStatusBadgeClass(status: string | undefined): string {
    const baseClass = 'inline-flex px-3 py-1 text-sm font-medium rounded-full';
    
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

  getDisplayStatus(status: string | undefined): string {
    return this.customerService.getDisplayStatus(status || '');
  }

  formatWeight(weightCategory: string | undefined): string {
    return this.customerService.formatWeight(weightCategory || '');
  }

  getDisplayId(id: string | undefined): string {
    if (!id) return 'N/A';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  }

  getFullId(): string {
    return this.parcel?.id || '';
  }

  copyParcelId(): void {
    if (this.parcel?.id) {
      navigator.clipboard.writeText(this.parcel.id).then(() => {
      }).catch(err => {
        console.error('Failed to copy parcel ID', err);
      });
    }
  }
}