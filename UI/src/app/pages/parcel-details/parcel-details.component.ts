import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import {
  CustomerService,
  ParcelWithTracking,
} from '../../shared/services/customer.service';
import { WebSocketService } from '../../shared/services/websocket.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-parcel-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parcel-details.component.html',
  styleUrls: ['./parcel-details.component.scss'],
})
export class ParcelDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  orderId: string | null = null;
  parcel: ParcelWithTracking | null = null;
  loading = false;
  error: string | null = null;
  connectionStatus = false;

  map!: L.Map;
  mapInitialized = false;
  shouldInitializeMap = false;
  pickupMarker: L.Marker | null = null;
  destinationMarker: L.Marker | null = null;
  courierMarker: L.Marker | null = null;
  routePolyline: L.Polyline | null = null;
  trackingMarkers: L.Marker[] = [];

  // WebSocket subscription
  private wsSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  // FIXED: Correct status order - PICKED should come before DELIVERED
  statuses = [
    { key: 'PENDING', label: 'Pending', icon: 'clock' },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: 'truck' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'check' },
    { key: 'PICKED', label: 'Picked', icon: 'hand' },
  ];

  currentStatus:
    | 'PENDING'
    | 'PICKED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'CANCELLED' = 'PENDING';

  get currentStatusIndex(): number {
    if (this.currentStatus === 'CANCELLED') {
      return -1;
    }
    return this.statuses.findIndex((s) => s.key === this.currentStatus);
  }

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private wsService: WebSocketService
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
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    // Clean up map
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIcons(): void {
    // Fix for Leaflet default markers not showing
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

  loadParcelDetails(): void {
    if (!this.orderId) return;

    this.loading = true;
    this.error = null;

    // Use the enhanced tracking endpoint
    const sub = this.customerService
      .getParcelWithTracking(this.orderId)
      .subscribe({
        next: (parcel) => {
          this.parcel = parcel;
          this.currentStatus = parcel.status;
          this.loading = false;
          this.shouldInitializeMap = true;

          // Check if coordinates exist
          if (
            parcel.pickupLat &&
            parcel.pickupLng &&
            parcel.destinationLat &&
            parcel.destinationLng
          ) {


            // Wait for Angular to render the DOM elements
            this.waitForMapContainer();
          } else {
            console.error('Missing coordinates in parcel data');
          }

          // Setup real-time tracking
          this.setupRealtimeTracking();
        },
        error: (err) => {
          console.error('Failed to load parcel details', err);
          this.error = 'Failed to load parcel details. Please try again.';
          this.loading = false;
        },
      });

    this.subscriptions.push(sub);
  }

  private setupRealtimeTracking(): void {
    if (!this.orderId) return;

    // Monitor connection status
    const connectionSub = this.wsService.connectionStatus$.subscribe(
      (status) => {
        this.connectionStatus = status;
        this.cdr.detectChanges();
      }
    );
    this.subscriptions.push(connectionSub);

    // Subscribe to WebSocket updates for this parcel
    this.wsSubscription = this.wsService
      .subscribeToParcel(this.orderId)
      .subscribe({
        next: (update) => {

          switch (update.type) {
            case 'location-update':
              this.handleLocationUpdate(update.data);
              break;
            case 'status-update':
              this.handleStatusUpdate(update.data);
              break;
            case 'parcel-update':
              this.handleParcelUpdate(update.data);
              break;
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
        },
      });
  }

  private handleLocationUpdate(update: any): void {
    if (!this.parcel) return;

    console.log('Handling location update:', update);

    // Add new tracking point
    if (!this.parcel.trackingPoints) {
      this.parcel.trackingPoints = [];
    }

    // Check if this tracking point already exists
    const existingPoint = this.parcel.trackingPoints.find(
      (point) =>
        Math.abs(point.latitude - update.latitude) < 0.0001 &&
        Math.abs(point.longitude - update.longitude) < 0.0001
    );

    if (!existingPoint) {
      this.parcel.trackingPoints.push({
        id: Date.now().toString(),
        latitude: update.latitude,
        longitude: update.longitude,
        address: update.address || null,
        timestamp: new Date(update.timestamp),
      });
    }

    // Update current courier location
    if (this.parcel.assignedCourier) {
      this.parcel.currentCourierLocation = {
        latitude: update.latitude,
        longitude: update.longitude,
        timestamp: new Date(update.timestamp),
      };
    }

    // Update route coordinates
    this.parcel.routeCoordinates = this.generateRouteCoordinates();

    // Update map if initialized
    if (this.map) {
      this.updateMapWithNewLocation(update);
    }

    this.cdr.detectChanges();
  }

  private handleStatusUpdate(update: any): void {
    if (!this.parcel) return;

    console.log('Status update:', update);
    this.parcel.status = update.status;
    this.currentStatus = update.status;

    // Update timestamps based on status
    if (update.status === 'DELIVERED' && update.timestamp) {
      this.parcel.deliveredAt = new Date(update.timestamp).toISOString();
    } else if (update.status === 'PICKED' && update.timestamp) {
      this.parcel.pickedUpAt = new Date(update.timestamp).toISOString();
    }

    this.cdr.detectChanges();
  }

  private handleParcelUpdate(update: any): void {
    console.log('General parcel update:', update);

    // Handle courier assignment updates
    if (update.type === 'courier-assigned') {
      // Reload parcel data to get courier info
      this.loadParcelDetails();
    }

    this.cdr.detectChanges();
  }

  private generateRouteCoordinates(): number[][] {
    if (!this.parcel) return [];

    const coordinates: number[][] = [];

    // Start with pickup location
    coordinates.push([this.parcel.pickupLat, this.parcel.pickupLng]);

    // Add tracking points if any
    if (this.parcel.trackingPoints && this.parcel.trackingPoints.length > 0) {
      this.parcel.trackingPoints
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .forEach((point) => {
          coordinates.push([point.latitude, point.longitude]);
        });
    }

    // End with destination (only if delivered)
    if (this.parcel.status === 'DELIVERED') {
      coordinates.push([
        this.parcel.destinationLat,
        this.parcel.destinationLng,
      ]);
    }

    return coordinates;
  }

  private waitForMapContainer(retryCount: number = 0): void {
    const maxRetries = 50; // Maximum 2.5 seconds (50 * 50ms)

    // Force change detection to ensure DOM is updated
    this.cdr.detectChanges();

    // Check if map container is available, if not, wait and try again
    const checkContainer = () => {
      if (this.mapContainer?.nativeElement) {
        console.log('Map container available, initializing map');
        setTimeout(() => this.loadMap(), 100);
      } else if (retryCount < maxRetries) {
        console.log(
          `Map container not yet available, waiting... (${
            retryCount + 1
          }/${maxRetries})`
        );
        setTimeout(() => this.waitForMapContainer(retryCount + 1), 50);
      } else {
        console.error('Map container failed to load after maximum retries');
      }
    };

    // Start checking after Angular change detection cycle
    setTimeout(checkContainer, 0);
  }

  loadMap(): void {
    console.log('loadMap called');

    // Check if all conditions are met before initializing
    if (this.mapInitialized) {
      console.log('Map already initialized');
      return;
    }

    if (!this.parcel?.pickupLat || !this.parcel?.destinationLat) {
      console.log('Missing parcel coordinates');
      return;
    }

    if (!this.mapContainer?.nativeElement) {
      console.log('Map container not available');
      return;
    }

    try {
      console.log('Initializing map...');
      this.mapInitialized = true;

      const mapElement = this.mapContainer.nativeElement;

      // Initialize the map
      this.map = L.map(mapElement, {
        center: [this.parcel.pickupLat, this.parcel.pickupLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Add tile layer
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }
      );

      tileLayer.addTo(this.map);
      console.log('Tile layer added');

      // Add pickup marker
      this.pickupMarker = L.marker([
        this.parcel.pickupLat,
        this.parcel.pickupLng,
      ]).addTo(this.map).bindPopup(`
          <div>
            <strong>📦 Pickup Location</strong><br>
            ${this.parcel.pickupAddress}
          </div>
        `);

      // Add destination marker
      this.destinationMarker = L.marker([
        this.parcel.destinationLat,
        this.parcel.destinationLng,
      ]).addTo(this.map).bindPopup(`
          <div>
            <strong>🏁 Destination</strong><br>
            ${this.parcel.destination}
          </div>
        `);

      console.log('Markers added');

      // Add route polyline if tracking data exists
      this.updateRoutePolyline();

      // Add current courier location if available
      this.updateCourierLocation();

      // Add tracking points
      this.addTrackingPoints();

      // Fit map to show all relevant points
      this.fitMapBounds();

      console.log('Map initialization completed successfully');

      // Force map resize and invalidation
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
      this.mapInitialized = false;
    }
  }

  private updateRoutePolyline(): void {
    if (!this.map || !this.parcel) return;

    // Remove existing polyline
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    // Create route coordinates - FIXED: Now properly generates route with tracking points
    const routeCoordinatesRaw = this.generateRouteCoordinates();
    const routeCoordinates: [number, number][] = routeCoordinatesRaw.map(
      (coord) => [coord[0], coord[1]] as [number, number]
    );

    if (routeCoordinates.length > 1) {
      // Create polyline with different colors based on status
      let polylineColor = '#3b82f6'; // Blue for default

      switch (this.parcel.status) {
        case 'PENDING':
          polylineColor = '#f59e0b'; // Amber
          break;
        case 'PICKED':
          polylineColor = '#8b5cf6'; // Purple
          break;
        case 'IN_TRANSIT':
          polylineColor = '#3b82f6'; // Blue
          break;
        case 'DELIVERED':
          polylineColor = '#10b981'; // Green
          break;
        case 'CANCELLED':
          polylineColor = '#ef4444'; // Red
          break;
      }

      this.routePolyline = L.polyline(routeCoordinates, {
        color: polylineColor,
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(this.map);

      console.log(
        'Route polyline updated with',
        routeCoordinates.length,
        'points'
      );
    }
  }

  private updateCourierLocation(): void {
    if (!this.map || !this.parcel?.currentCourierLocation) return;

    // Remove existing courier marker
    if (this.courierMarker) {
      this.map.removeLayer(this.courierMarker);
    }

    // Create custom courier icon
    const courierIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'courier-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const { latitude, longitude, timestamp } =
      this.parcel.currentCourierLocation;

    this.courierMarker = L.marker([latitude, longitude], {
      icon: courierIcon,
    }).addTo(this.map).bindPopup(`
        <div>
          <strong>🚚 Courier Location</strong><br>
          <small>Updated: ${new Date(timestamp).toLocaleString()}</small>
        </div>
      `);

    console.log('Courier location updated');
  }

  private addTrackingPoints(): void {
    if (!this.map || !this.parcel?.trackingPoints) return;

    // Remove existing tracking markers
    this.trackingMarkers.forEach((marker) => {
      this.map!.removeLayer(marker);
    });
    this.trackingMarkers = [];

    // Add tracking point markers
    this.parcel.trackingPoints.forEach((point, index) => {
      const trackingIcon = L.divIcon({
        html: `
          <div style="
            background-color: #10b981;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          "></div>
        `,
        className: 'tracking-point-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([point.latitude, point.longitude], {
        icon: trackingIcon,
      }).addTo(this.map!).bindPopup(`
          <div>
            <strong>📍 Tracking Point ${index + 1}</strong><br>
            ${
              point.address ||
              `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`
            }<br>
            <small>${new Date(point.timestamp).toLocaleString()}</small>
          </div>
        `);

      this.trackingMarkers.push(marker);
    });

    console.log('Added', this.trackingMarkers.length, 'tracking points');
  }

  private fitMapBounds(): void {
    if (!this.map || !this.parcel) return;

    const markers: L.Marker[] = [];

    // Add pickup and destination markers
    if (this.pickupMarker) markers.push(this.pickupMarker);
    if (this.destinationMarker) markers.push(this.destinationMarker);

    // Add courier marker if exists
    if (this.courierMarker) markers.push(this.courierMarker);

    // Add tracking markers
    markers.push(...this.trackingMarkers);

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds(), {
        padding: [20, 20],
        maxZoom: 15,
      });
    }
  }

  private updateMapWithNewLocation(locationUpdate: any): void {
    if (!this.map) return;

    // Update courier location
    this.updateCourierLocation();

    // Update route polyline
    this.updateRoutePolyline();

    // Add new tracking point
    this.addTrackingPoints();

    // Fit bounds to include new location
    this.fitMapBounds();

    console.log('Map updated with new location');
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
      case 'PICKED':
        return `${baseClass} bg-purple-100 text-purple-800`;
      case 'DELIVERED':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'CANCELLED':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getDisplayStatus(status: string | undefined): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PICKED':
        return 'Picked';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  }

  formatWeight(weightCategory: string | undefined): string {
    switch (weightCategory) {
      case 'LIGHT':
        return '< 5 kg';
      case 'MEDIUM':
        return '5-20 kg';
      case 'HEAVY':
        return '> 20 kg';
      default:
        return 'N/A';
    }
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
      navigator.clipboard
        .writeText(this.parcel.id)
        .then(() => {
          console.log('Parcel ID copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy parcel ID', err);
        });
    }
  }
}
