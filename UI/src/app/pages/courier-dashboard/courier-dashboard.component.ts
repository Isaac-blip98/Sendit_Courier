import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CourierService,
  CourierData,
  AssignedParcel,
  ParcelLocation,
} from '../../shared/services/courier.service';
import { WebSocketService } from '../../shared/services/websocket.service';
import { Subscription, interval } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courier-dashboard.component.html',
  styleUrls: ['./courier-dashboard.component.scss'],
})
export class CourierDashboardComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  courierData: CourierData | null = null;
  assignedParcels: AssignedParcel[] = [];
  parcelRouteLocations: ParcelLocation[] = [];
  updatingLocation = false;
  autoLocationEnabled = false;
  connectionStatus = false;

  // Location selection options
  selectedLocationMode: 'manual' | 'route' | 'gps' = 'route';
  selectedRouteLocation: ParcelLocation | null = null;

  manualLocation = {
    latitude: null as number | null,
    longitude: null as number | null,
    address: '',
  };

  locationHistory: any[] = [];
  message: { type: 'success' | 'error'; text: string } | null = null;

  private subscriptions: Subscription[] = [];
  private map: L.Map | null = null;
  private currentLocationMarker: L.Marker | null = null;
  private parcelMarkers: L.Marker[] = [];
  private autoLocationInterval?: Subscription;
  private courierId: string | null = null;
  private subscribeToNewParcels(parcels: AssignedParcel[]): void {
    parcels.forEach((parcel) => {
      if (
        !this.subscriptions.some(
          (sub) => sub.closed === false && sub instanceof Subscription
        )
      ) {
        const parcelSub = this.wsService
          .subscribeToParcel(parcel.id)
          .subscribe({
            next: (update) => this.handleParcelUpdate(update),
            error: (error) =>
              console.error(
                `Error receiving parcel ${parcel.id} update:`,
                error
              ),
          });
        this.subscriptions.push(parcelSub);
      }
    });
  }

  constructor(
    private courierService: CourierService,
    private wsService: WebSocketService
  ) {
    this.fixLeafletIcons();
    this.courierId = localStorage.getItem('courierId');
  }

  ngOnInit(): void {
    if (!this.courierId) {
      this.showMessage('error', 'No courier ID found. Please login again.');
      return;
    }

    this.loadCourierData();
    this.loadAssignedParcels();
    this.loadParcelRouteLocations();
    this.loadLocationHistory();
    this.setupWebSocketConnection();
    this.subscribeToServiceUpdates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.autoLocationInterval) {
      this.autoLocationInterval.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
    }
    this.wsService.disconnect();
  }

  private subscribeToServiceUpdates(): void {
    const courierDataSub = this.courierService.courierData$.subscribe(
      (data) => {
        if (data) {
          this.courierData = data;
          this.updateMapIfReady();
        }
      }
    );
    this.subscriptions.push(courierDataSub);
  }

  private fixLeafletIcons(): void {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }

  private setupWebSocketConnection(): void {
    const connectionSub = this.wsService.connectionStatus$.subscribe(
      (status) => {
        this.connectionStatus = status;
        if (status) {
          this.showMessage('success', 'Connected to live tracking');
        } else {
          this.showMessage('error', 'Disconnected from live tracking');
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Subscribe to parcel updates
    this.assignedParcels.forEach((parcel) => {
      const parcelSub = this.wsService.subscribeToParcel(parcel.id).subscribe({
        next: (update) => this.handleParcelUpdate(update),
        error: (error) =>
          console.error('Error receiving parcel update:', error),
      });
      this.subscriptions.push(parcelSub);
    });
  }

  private handleParcelUpdate(update: any): void {
    console.log('Received parcel update:', update);

    switch (update.type) {
      case 'status-update':
        this.handleStatusUpdate(update.data);
        break;
      case 'parcel-assignment':
        this.loadAssignedParcels();
        this.loadParcelRouteLocations();
        break;
    }
  }

  private handleStatusUpdate(statusUpdate: any): void {
    const parcel = this.assignedParcels.find(
      (p) => p.id === statusUpdate.parcelId
    );
    if (parcel) {
      parcel.status = statusUpdate.status;
      this.showMessage(
        'success',
        `Parcel ${parcel.id.substring(0, 8)} status updated to ${
          statusUpdate.status
        }`
      );
    }
  }

  loadCourierData(): void {
    if (!this.courierId) return;

    const sub = this.courierService.getCourierById(this.courierId).subscribe({
      next: (data) => {
        this.courierData = data;

        if (data.currentLat && data.currentLng) {
          this.manualLocation.latitude = data.currentLat;
          this.manualLocation.longitude = data.currentLng;
          this.updateMapIfReady();
        }
      },
      error: (error) => {
        console.error('Error loading courier data:', error);
        this.showMessage('error', 'Failed to load courier data');
      },
    });

    this.subscriptions.push(sub);
  }

  loadAssignedParcels(): void {
    if (!this.courierId) {
      this.showMessage('error', 'No courier ID found. Please login again.');
      return;
    }

    const sub = this.courierService
      .getAssignedParcels(this.courierId)
      .subscribe({
        next: (parcels) => {
          this.assignedParcels = parcels;
          if (this.courierData) {
            this.courierData.assignedParcels = parcels;
          }
          this.updateParcelMarkersOnMap();
          this.subscribeToNewParcels(parcels);
        },
        error: (error) => {
          console.error('Error loading assigned parcels:', error);
          const errorMessage =
            error.status === 404
              ? 'Assigned parcels endpoint not found. Please contact support.'
              : error.status === 401
              ? 'Authentication failed. Please login again.'
              : `Failed to load assigned parcels: ${
                  error.message || 'Unknown error'
                }`;
          this.showMessage('error', errorMessage);
        },
      });

    this.subscriptions.push(sub);
  }

  loadParcelRouteLocations(): void {
    if (!this.courierId) {
      this.showMessage('error', 'No courier ID found. Please login again.');
      return;
    }

    const sub = this.courierService
      .getParcelRouteLocations(this.courierId)
      .subscribe({
        next: (locations) => {
          this.parcelRouteLocations = locations;
          this.updateParcelMarkersOnMap();
        },
        error: (error) => {
          console.error('Error loading route locations:', error);
          const errorMessage =
            error.status === 404
              ? 'Route locations endpoint not found. Please contact support.'
              : error.status === 401
              ? 'Authentication failed. Please login again.'
              : `Failed to load route locations: ${
                  error.message || 'Unknown error'
                }`;
          this.showMessage('error', errorMessage);
        },
      });

    this.subscriptions.push(sub);
  }

  loadLocationHistory(): void {
    if (!this.courierId) {
      this.showMessage('error', 'No courier ID found. Please login again.');
      return;
    }

    const sub = this.courierService
      .getLocationHistory(this.courierId)
      .subscribe({
        next: (history) => {
          this.locationHistory = history;
        },
        error: (error) => {
          console.error('Error loading location history:', error);
          const errorMessage =
            error.status === 401
              ? 'Authentication failed. Please login again.'
              : `Failed to load location history: ${
                  error.message || 'Unknown error'
                }`;
          this.showMessage('error', errorMessage);
        },
      });

    this.subscriptions.push(sub);
  }

  // Location selection methods
  onLocationModeChange(): void {
    this.selectedRouteLocation = null;
    this.manualLocation = { latitude: null, longitude: null, address: '' };
  }

  onRouteLocationSelect(): void {
    if (this.selectedRouteLocation) {
      this.manualLocation.latitude = this.selectedRouteLocation.latitude;
      this.manualLocation.longitude = this.selectedRouteLocation.longitude;
      this.manualLocation.address = this.selectedRouteLocation.address;
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.showMessage('error', 'Geolocation is not supported by this browser');
      return;
    }

    this.updatingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.manualLocation.latitude = position.coords.latitude;
        this.manualLocation.longitude = position.coords.longitude;
        this.manualLocation.address = '';
        this.updateLocation();
      },
      (error) => {
        console.error('Error getting location:', error);
        this.showMessage('error', 'Failed to get current location');
        this.updatingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  toggleAutoLocation(): void {
    this.autoLocationEnabled = !this.autoLocationEnabled;

    if (this.autoLocationEnabled) {
      this.autoLocationInterval = interval(30000).subscribe(() => {
        if (this.selectedLocationMode === 'gps') {
          this.getCurrentLocation();
        }
      });
      this.showMessage('success', 'Auto location updates enabled');

      if (this.selectedLocationMode === 'gps') {
        this.getCurrentLocation();
      }
    } else {
      if (this.autoLocationInterval) {
        this.autoLocationInterval.unsubscribe();
        this.autoLocationInterval = undefined;
      }
      this.showMessage('success', 'Auto location updates disabled');
    }
  }

  updateLocation(): void {
    if (!this.isValidLocation()) {
      this.showMessage('error', 'Please select or enter valid coordinates');
      this.updatingLocation = false;
      return;
    }

    if (!this.courierId) {
      this.showMessage('error', 'Courier ID not found');
      this.updatingLocation = false;
      return;
    }

    this.updatingLocation = true;

    const locationData = {
      latitude: this.manualLocation.latitude!,
      longitude: this.manualLocation.longitude!,
      address: this.manualLocation.address || undefined,
      parcelId: this.selectedRouteLocation?.parcelId,
    };

    const sub = this.courierService
      .updateLocation(this.courierId, locationData)
      .subscribe({
        next: (response) => {
          this.showMessage('success', 'Location updated successfully');
          this.loadCourierData();
          this.loadLocationHistory();

          if (response.updatedParcels && response.updatedParcels.length > 0) {
            this.showMessage(
              'success',
              `Location updated. ${response.updatedParcels.length} parcel(s) status updated.`
            );
            this.loadAssignedParcels(); // Refresh parcels to get updated status
          }
        },
        error: (error) => {
          console.error('Error updating location:', error);
          this.showMessage('error', 'Failed to update location');
        },
        complete: () => {
          this.updatingLocation = false;
        },
      });

    this.subscriptions.push(sub);
  }

  isValidLocation(): boolean {
    return (
      this.manualLocation.latitude !== null &&
      this.manualLocation.longitude !== null &&
      !isNaN(this.manualLocation.latitude) &&
      !isNaN(this.manualLocation.longitude) &&
      this.manualLocation.latitude >= -90 &&
      this.manualLocation.latitude <= 90 &&
      this.manualLocation.longitude >= -180 &&
      this.manualLocation.longitude <= 180
    );
  }

  initializeMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    try {
      // Use default center if no courier location
      const defaultLat = this.courierData?.currentLat || -1.2921; // Default to Nairobi
      const defaultLng = this.courierData?.currentLng || 36.8219;

      this.map = L.map(this.mapContainer.nativeElement, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);

      this.updateMapLocation();
      this.updateParcelMarkersOnMap();

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  updateMapIfReady(): void {
    if (this.map) {
      this.updateMapLocation();
    } else if (this.mapContainer?.nativeElement) {
      this.initializeMap();
    }
  }

  updateMapLocation(): void {
    if (
      !this.map ||
      !this.courierData?.currentLat ||
      !this.courierData?.currentLng
    ) {
      return;
    }

    if (this.currentLocationMarker) {
      this.map.removeLayer(this.currentLocationMarker);
    }

    const courierIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'courier-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    this.currentLocationMarker = L.marker(
      [this.courierData.currentLat, this.courierData.currentLng],
      { icon: courierIcon }
    ).addTo(this.map).bindPopup(`
      <div>
        <strong>🚚 Your Current Location</strong><br>
        <small>Lat: ${this.courierData.currentLat.toFixed(6)}</small><br>
        <small>Lng: ${this.courierData.currentLng.toFixed(6)}</small>
      </div>
    `);

    this.map.setView(
      [this.courierData.currentLat, this.courierData.currentLng],
      15
    );
  }

  updateParcelMarkersOnMap(): void {
    if (!this.map) return;

    // Remove existing parcel markers
    this.parcelMarkers.forEach((marker) => {
      this.map!.removeLayer(marker);
    });
    this.parcelMarkers = [];

    // Add markers for route locations
    this.parcelRouteLocations.forEach((location) => {
      const iconColor =
        location.type === 'pickup'
          ? '#ef4444'
          : location.type === 'delivery'
          ? '#22c55e'
          : '#f59e0b';

      const locationIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        className: 'parcel-location-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([location.latitude, location.longitude], {
        icon: locationIcon,
      }).addTo(this.map!).bindPopup(`
          <div>
            <strong>${location.type.toUpperCase()}</strong><br>
            <small>${location.address}</small><br>
            <small>Parcel: ${location.parcelId.substring(0, 8)}</small>
          </div>
        `);

      this.parcelMarkers.push(marker);
    });
  }

  viewParcelDetails(parcelId: string): void {
    console.log('View parcel details:', parcelId);
    // Implementation depends on your routing setup
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'inline-flex px-2 py-1 text-xs font-medium rounded-full';

    switch (status) {
      case 'PICKED':
        return `${baseClass} bg-purple-100 text-purple-800`;
      case 'IN_TRANSIT':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'DELIVERED':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'PENDING':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'CANCELLED':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getDisplayStatus(status: string): string {
    switch (status) {
      case 'PICKED':
        return 'Picked';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getLocationTypeIcon(type: string): string {
    switch (type) {
      case 'pickup':
        return '📦';
      case 'delivery':
        return '🏁';
      case 'waypoint':
        return '📍';
      default:
        return '📍';
    }
  }

  private showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => {
      this.message = null;
    }, 5000);
  }
}
