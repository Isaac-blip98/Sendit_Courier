// customer.service.ts (Angular service)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ParcelStats {
  totalParcels: number;
  totalSent: number;
  totalReceived: number;
  statusCounts: {
    all: number;
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
}

export interface Parcel {
  id: string;
  senderId: string;
  receiverId: string;
  assignedCourierId?: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  weightCategory: string;
  status: 'PENDING' | 'PICKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDistance?: number;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  assignedCourier?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    currentLat: number | null;
    currentLng: number | null;
  };
}

export interface ParcelWithTracking extends Parcel {
  trackingPoints?: {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    timestamp: Date;
  }[];
  routeCoordinates?: number[][];
  currentCourierLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export interface ParcelEvent {
  id: string;
  parcelId: string;
  status: string;
  location?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/parcels`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  calculateStats(parcels: Parcel[], currentUserId: string): ParcelStats {
    const stats: ParcelStats = {
      totalParcels: parcels.length,
      totalSent: parcels.filter((p) => p.senderId === currentUserId).length,
      totalReceived: parcels.filter((p) => p.receiverId === currentUserId)
        .length,
      statusCounts: {
        all: parcels.length,
        pending: parcels.filter((p) => p.status === 'PENDING').length,
        inTransit: parcels.filter((p) => p.status === 'IN_TRANSIT').length,
        delivered: parcels.filter((p) => p.status === 'DELIVERED').length,
        cancelled: parcels.filter((p) => p.status === 'CANCELLED').length,
      },
    };
    return stats;
  }

  // Get parcel with basic information
  getParcel(parcelId: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${parcelId}`, {
      headers: this.getHeaders(),
    });
  }

  // Get parcel with tracking information
  getParcelWithTracking(parcelId: string): Observable<ParcelWithTracking> {
    return this.http.get<ParcelWithTracking>(
      `${this.apiUrl}/${parcelId}/tracking`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // Get parcel events/history
  getParcelEvents(parcelId: string): Observable<ParcelEvent[]> {
    return this.http.get<ParcelEvent[]>(`${this.apiUrl}/${parcelId}/events`, {
      headers: this.getHeaders(),
    });
  }

  // Get all parcels for a user
  getUserParcels(userId: string): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.apiUrl}/user/${userId}/all`, {
      headers: this.getHeaders(),
    });
  }

  // Get user parcel statistics
  getUserParcelStats(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}/stats`, {
      headers: this.getHeaders(),
    });
  }

  // Create new parcel
  createParcel(parcelData: any): Observable<Parcel> {
    return this.http.post<Parcel>(this.apiUrl, parcelData, {
      headers: this.getHeaders(),
    });
  }

  // Update parcel
  updateParcel(parcelId: string, updateData: any): Observable<Parcel> {
    return this.http.patch<Parcel>(`${this.apiUrl}/${parcelId}`, updateData, {
      headers: this.getHeaders(),
    });
  }

  // Delete parcel
  deleteParcel(parcelId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${parcelId}`, {
      headers: this.getHeaders(),
    });
  }

  // Assign courier to parcel
  assignCourier(parcelId: string, courierId: string): Observable<Parcel> {
    return this.http.patch<Parcel>(
      `${this.apiUrl}/assign`,
      {
        parcelId,
        courierId,
      },
      {
        headers: this.getHeaders(),
      }
    );
  }

  formatWeight(weightCategory: string): string {
    switch (weightCategory) {
      case 'SMALL':
        return '0 - 1kg';
      case 'MEDIUM':
        return '1 - 5kg';
      case 'LARGE':
        return '5 - 20kg';
      case 'EXTRA_LARGE':
        return '20kg+';
      default:
        return 'Unknown';
    }
  }

  getDisplayStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending Pickup';
      case 'PICKED':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}
