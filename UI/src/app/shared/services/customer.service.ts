import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Parcel {
  id: string;
  senderId: string;
  receiverId: string;
  assignedCourierId?: string | null;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  weightCategory: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

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

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private api = 'http://localhost:3000/parcels';

  constructor(private http: HttpClient) {
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getParcelsByUser(userId: string): Observable<Parcel[]> {
    const url = `${this.api}/user/${userId}`;
    
    return this.http.get<Parcel[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(' getParcelsByUser error:', error);
        throw error;
      })
    );
  }

  getAllParcelsForUser(userId: string): Observable<Parcel[]> {
    // Fix: Use consistent API base URL
    const url = `${environment.apiUrl || 'http://localhost:3000'}/parcels/user/${userId}/all`;
    
    return this.http.get<Parcel[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(' getAllParcelsForUser error:', error);
        console.error(' Error status:', error.status);
        console.error(' Error message:', error.message);
        console.error(' Error url:', error.url);
        throw error;
      })
    );
  }

  getParcelById(parcelId: string): Observable<Parcel> {
    const url = `${this.api}/${parcelId}`;
    
    return this.http.get<Parcel>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(' getParcelById error:', error);
        throw error;
      })
    );
  }

  getParcelStats(userId: string): Observable<ParcelStats> {
    const url = `${this.api}/user/${userId}/stats`;
    console.log('📡 API Call: getParcelStats ->', url);
    
    return this.http.get<ParcelStats>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(' getParcelStats error:', error);
        throw error;
      })
    );
  }

  // Helper method to calculate statistics
  calculateStats(parcels: Parcel[], currentUserId: string): ParcelStats {
    
    if (!parcels || !Array.isArray(parcels)) {
      console.warn(' Invalid parcels data for calculateStats:', parcels);
      return {
        totalParcels: 0,
        totalSent: 0,
        totalReceived: 0,
        statusCounts: {
          all: 0,
          pending: 0,
          inTransit: 0,
          delivered: 0,
          cancelled: 0,
        },
      };
    }

    const sentParcels = parcels.filter((p) => p.senderId === currentUserId);
    const receivedParcels = parcels.filter((p) => p.receiverId === currentUserId);
    

    const stats = {
      totalParcels: parcels.length,
      totalSent: sentParcels.length,
      totalReceived: receivedParcels.length,
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

  // Helper method to format weight
  formatWeight(weightCategory: string): string {
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

  // Helper method to map status for display
  getDisplayStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}