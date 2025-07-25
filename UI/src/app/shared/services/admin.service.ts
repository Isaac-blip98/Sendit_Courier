import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

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
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = 'http://localhost:3000/admin';
  private readonly PARCELS_URL = 'http://localhost:3000/parcels';

  // Subject to notify when stats should be refreshed
  statsChanged = new Subject<void>();
  parcelsChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  getDashboardParcels(): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.API_URL}/dashboard/parcels`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats`);
  }

  getDashboardUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API_URL}/dashboard/users`);
  }

  updateUser(id: string, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API_URL}/dashboard/users/${id}`, data).pipe(
      tap(() => this.statsChanged.next())
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/dashboard/users/${id}`).pipe(
      tap(() => this.statsChanged.next())
    );
  }

  getParcels(): Observable<AdminParcel[]> {
    return this.http.get<AdminParcel[]>(this.PARCELS_URL);
  }

  getParcel(id: string): Observable<AdminParcel> {
    return this.http.get<AdminParcel>(`${this.PARCELS_URL}/${id}`);
  }

  createParcel(data: Partial<AdminParcel>): Observable<AdminParcel> {
    return this.http.post<AdminParcel>(this.PARCELS_URL, data).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  updateParcel(id: string, data: Partial<AdminParcel>): Observable<AdminParcel> {
    return this.http.patch<AdminParcel>(`${this.PARCELS_URL}/${id}`, data).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  deleteParcel(id: string): Observable<any> {
    return this.http.delete(`${this.PARCELS_URL}/${id}`).pipe(
      tap(() => this.parcelsChanged.next())
    );
  }

  // Add more methods for stats and users as needed
} 