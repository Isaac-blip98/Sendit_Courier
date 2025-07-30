import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  address?: string;
  parcelId?: string; // Optional parcel association
}

export interface LocationUpdateResponse {
  success: boolean;
  message: string;
  updatedParcels?: string[];
}

export interface CourierLocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  timestamp: Date;
  parcelId?: string;
}

export interface ParcelLocation {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'pickup' | 'delivery' | 'waypoint';
  parcelId: string;
}

export interface AssignedParcel {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  destination: string;
  destinationLat?: number;
  destinationLng?: number;
  receiverName: string;
  receiverPhone: string;
  waypoints?: ParcelLocation[];
}

export interface CourierData {
  id: string;
  name: string;
  currentLat: number | null;
  currentLng: number | null;
  isAvailable: boolean;
  assignedParcels: AssignedParcel[];
}

@Injectable({
  providedIn: 'root',
})
export class CourierService {
  private apiUrl = `${environment.apiUrl}/couriers`;
  private courierDataSubject = new BehaviorSubject<CourierData | null>(null);
  public courierData$ = this.courierDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getCourierById(courierId: string): Observable<CourierData> {
    return this.http.get<CourierData>(`${this.apiUrl}/${courierId}`, {
      headers: this.getHeaders(),
    });
  }

  // Fetch assigned parcels separately
  getAssignedParcels(courierId: string): Observable<AssignedParcel[]> {
    return this.http.get<AssignedParcel[]>(
      `${this.apiUrl}/${courierId}/parcels`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // Get all available locations along parcel routes
  getParcelRouteLocations(courierId: string): Observable<ParcelLocation[]> {
    return this.http.get<ParcelLocation[]>(
      `${this.apiUrl}/${courierId}/route-locations`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  updateLocation(
    courierId: string,
    locationData: LocationUpdateRequest
  ): Observable<LocationUpdateResponse> {
    return this.http.patch<LocationUpdateResponse>(
      `${this.apiUrl}/${courierId}/location`,
      locationData,
      { headers: this.getHeaders() }
    );
  }

  getLocationHistory(
    courierId: string,
    limit?: number
  ): Observable<CourierLocationHistory[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.http.get<CourierLocationHistory[]>(
      `${this.apiUrl}/${courierId}/location-history${params}`,
      { headers: this.getHeaders() }
    );
  }

  // Update parcel status
  updateParcelStatus(
    parcelId: string,
    status: string,
    location?: { lat: number; lng: number }
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/parcels/${parcelId}/status`,
      {
        status,
        location,
      },
      { headers: this.getHeaders() }
    );
  }

  // Refresh courier data and notify subscribers
  refreshCourierData(courierId: string): void {
    this.getCourierById(courierId).subscribe({
      next: (data) => {
        this.courierDataSubject.next(data);
      },
      error: (error) => {
        console.error('Error refreshing courier data:', error);
      },
    });
  }
}
