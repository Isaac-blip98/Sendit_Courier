// First install socket.io-client: npm install socket.io-client @types/socket.io-client

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';

interface LocationUpdate {
  parcelId: string;
  courierId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

interface StatusUpdate {
  parcelId: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  
  public connectionStatus$ = this.connectionStatus.asObservable();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    const token = localStorage.getItem('access_token');
    
    this.socket = io(`${environment.apiUrl}/tracking`, {
      auth: {
        token: token
      },
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to tracking server');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from tracking server');
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectionStatus.next(false);
    });
  }

  subscribeToParcel(parcelId: string): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }

      // Subscribe to parcel updates
      this.socket.emit('subscribe-parcel', { parcelId });

      // Listen for location updates
      const locationUpdateHandler = (update: LocationUpdate) => {
        if (update.parcelId === parcelId) {
          observer.next({ type: 'location-update', data: update });
        }
      };

      // Listen for status updates
      const statusUpdateHandler = (update: StatusUpdate) => {
        if (update.parcelId === parcelId) {
          observer.next({ type: 'status-update', data: update });
        }
      };

      // Listen for general parcel updates
      const parcelUpdateHandler = (update: any) => {
        if (update.parcelId === parcelId) {
          observer.next({ type: 'parcel-update', data: update });
        }
      };

      this.socket.on('location-update', locationUpdateHandler);
      this.socket.on('status-update', statusUpdateHandler);
      this.socket.on('parcel-update', parcelUpdateHandler);

      // Cleanup function
      return () => {
        if (this.socket) {
          this.socket.emit('unsubscribe-parcel', { parcelId });
          this.socket.off('location-update', locationUpdateHandler);
          this.socket.off('status-update', statusUpdateHandler);
          this.socket.off('parcel-update', parcelUpdateHandler);
        }
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.next(false);
    }
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeConnection();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}