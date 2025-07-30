import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment.prod';

export interface Parcel {
  orderNumber: string;
  date: string;
  customer: string;
  time: string;
  destination: string;
  pickupLocation: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalParcels: number;
  totalPending: number;
  totalCouriers?: number;
  activeCouriers?: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  status: 'active' | 'inactive';
  deletedAt?: Date | null;
  phone?: string;
  profileImage?: string;
}

export interface AdminParcel {
  id: string;
  senderId?: string;
  receiverId?: string;
  receiverName?: string;
  receiverPhone?: string;
  pickupAddress?: string;
  destination?: string;
  weightCategory?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedCourierId?: string;
  assignedCourier?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    currentLat?: number;
    currentLng?: number;
  };
}

export interface Courier {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  assignedParcels: {
    id: string;
    status: string;
    pickupAddress: string;
    destination: string;
    receiverName: string;
    receiverPhone: string;
  }[];
  createdAt: string;
  profileImage?: string;
}

export interface CreateCourierDto {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateCourierDto {
  name?: string;
  email?: string;
  phone?: string;
  isAvailable?: boolean;
}

export interface AssignCourierDto {
  parcelId: string;
  courierId: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = `${environment.apiUrl}/admin`;
  private readonly PARCELS_URL = `${environment.apiUrl}/parcels`;
  private readonly COURIERS_URL = `${environment.apiUrl}/couriers`;

  // Subject to notify when stats should be refreshed
  statsChanged = new Subject<void>();
  parcelsChanged = new Subject<void>();
  couriersChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Helper method to get headers with authentication
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Existing methods
  getDashboardParcels(): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.API_URL}/dashboard/parcels`, {
      headers: this.getHeaders()
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats`, {
      headers: this.getHeaders()
    });
  }

  getDashboardUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API_URL}/dashboard/users`, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API_URL}/dashboard/users/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.statsChanged.next())
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/dashboard/users/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.statsChanged.next())
    );
  }

  getParcels(): Observable<AdminParcel[]> {
    return this.http.get<AdminParcel[]>(this.PARCELS_URL, {
      headers: this.getHeaders()
    });
  }

  getParcel(id: string): Observable<AdminParcel> {
    return this.http.get<AdminParcel>(`${this.PARCELS_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createParcel(data: Partial<AdminParcel>): Observable<AdminParcel> {
    return this.http.post<AdminParcel>(this.PARCELS_URL, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  updateParcel(id: string, data: Partial<AdminParcel>): Observable<AdminParcel> {
    return this.http.patch<AdminParcel>(`${this.PARCELS_URL}/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  deleteParcel(id: string): Observable<any> {
    return this.http.delete(`${this.PARCELS_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  // Courier management methods
  getCouriers(): Observable<Courier[]> {
    return this.http.get<Courier[]>(this.COURIERS_URL, {
      headers: this.getHeaders()
    });
  }

  getCourier(id: string): Observable<Courier> {
    return this.http.get<Courier>(`${this.COURIERS_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createCourier(data: CreateCourierDto): Observable<Courier> {
    return this.http.post<Courier>(this.COURIERS_URL, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.couriersChanged.next();
        this.statsChanged.next();
      })
    );
  }

  updateCourier(id: string, data: UpdateCourierDto): Observable<Courier> {
    return this.http.patch<Courier>(`${this.COURIERS_URL}/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.couriersChanged.next())
    );
  }

  deleteCourier(id: string): Observable<any> {
    return this.http.delete(`${this.COURIERS_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.couriersChanged.next();
        this.statsChanged.next();
      })
    );
  }

  // Primary parcel assignment method
  assignCourier(data: AssignCourierDto): Observable<AdminParcel> {
    console.log('Making POST request to:', `${this.PARCELS_URL}/assign`);
    console.log('With data:', data);
    
    return this.http.post<AdminParcel>(`${this.PARCELS_URL}/assign`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('Assignment response:', response);
        this.parcelsChanged.next();
        this.couriersChanged.next();
      })
    );
  }

  // ALIAS: Method that matches component expectations
  assignCourierToParcel(assignmentData: AssignCourierDto): Observable<AdminParcel> {
    console.log('assignCourierToParcel called with:', assignmentData);
    return this.assignCourier(assignmentData);
  }

  // Primary unassign method
  unassignCourier(parcelId: string): Observable<AdminParcel> {
    console.log('Making PATCH request to:', `${this.PARCELS_URL}/${parcelId}/unassign`);
    
    return this.http.patch<AdminParcel>(`${this.PARCELS_URL}/${parcelId}/unassign`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.parcelsChanged.next();
        this.couriersChanged.next();
      })
    );
  }

  // ALIAS: Method that matches component expectations
  unassignCourierFromParcel(parcelId: string): Observable<AdminParcel> {
    console.log('unassignCourierFromParcel called with parcelId:', parcelId);
    return this.unassignCourier(parcelId);
  }

  getAvailableCouriers(): Observable<Courier[]> {
    return this.http.get<Courier[]>(`${this.COURIERS_URL}/available`, {
      headers: this.getHeaders()
    });
  }

  // Location tracking
  getCourierLocationHistory(courierId: string, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.COURIERS_URL}/${courierId}/location-history?limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  updateCourierLocation(courierId: string, location: { latitude: number; longitude: number; address?: string }): Observable<any> {
    return this.http.patch(`${this.COURIERS_URL}/${courierId}/location`, location, {
      headers: this.getHeaders()
    });
  }

  // Courier availability management
  updateCourierAvailability(courierId: string, isAvailable: boolean): Observable<Courier> {
    return this.http.patch<Courier>(`${this.COURIERS_URL}/${courierId}/availability`, { isAvailable }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.couriersChanged.next())
    );
  }

  // Dashboard analytics
  getCourierStats(): Observable<{
    totalCouriers: number;
    availableCouriers: number;
    busyCouriers: number;
    totalDeliveries: number;
  }> {
    return this.http.get<any>(`${this.API_URL}/courier-stats`, {
      headers: this.getHeaders()
    });
  }

  // Real-time tracking
  getParcelTracking(parcelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.PARCELS_URL}/${parcelId}/tracking`, {
      headers: this.getHeaders()
    });
  }

  // Bulk operations
  bulkAssignParcels(assignments: AssignCourierDto[]): Observable<any> {
    return this.http.post(`${this.PARCELS_URL}/bulk-assign`, { assignments }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.parcelsChanged.next();
        this.couriersChanged.next();
      })
    );
  }

  // Search and filtering
  searchCouriers(query: string): Observable<Courier[]> {
    return this.http.get<Courier[]>(`${this.COURIERS_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders()
    });
  }

  searchParcels(query: string): Observable<AdminParcel[]> {
    return this.http.get<AdminParcel[]>(`${this.PARCELS_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders()
    });
  }

  // Courier performance metrics
  getCourierPerformance(courierId: string, dateRange?: { start: Date; end: Date }): Observable<{
    totalDeliveries: number;
    completedDeliveries: number;
    averageDeliveryTime: number;
    customerRating: number;
  }> {
    const params = dateRange ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}` : '';
    return this.http.get<any>(`${this.COURIERS_URL}/${courierId}/performance${params}`, {
      headers: this.getHeaders()
    });
  }
}