import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

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

@Injectable()
@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: [
      'http://localhost:4200',
      'https://sendit-courier-5q3uq2pix-elvis-projects-2f222bc8.vercel.app',
      /.*\.vercel\.app$/
    ],
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private parcelSubscriptions = new Map<string, Set<string>>(); // parcelId -> Set of socketIds
  private socketToUser = new Map<string, { userId: string; role: string }>(); // socketId -> user info

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client attempted to connect without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      this.socketToUser.set(client.id, {
        userId: payload.sub,
        role: payload.role,
      });

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`);
      
      // Join user to their own room for targeted updates
      client.join(`user:${payload.sub}`);
      
      // If courier, join courier room
      if (payload.role === 'COURIER') {
        client.join(`courier:${payload.sub}`);
      }

    } catch (error) {
      this.logger.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up subscriptions
    this.parcelSubscriptions.forEach((subscribers, parcelId) => {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.parcelSubscriptions.delete(parcelId);
      }
    });

    this.socketToUser.delete(client.id);
  }

  @SubscribeMessage('subscribe-parcel')
  async handleSubscribeParcel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { parcelId: string },
  ) {
    try {
      const { parcelId } = data;
      const userInfo = this.socketToUser.get(client.id);
      
      if (!userInfo) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Verify user has access to this parcel
      const hasAccess = await this.verifyParcelAccess(parcelId, userInfo.userId, userInfo.role);
      
      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to parcel' });
        return;
      }

      // Add to subscriptions
      if (!this.parcelSubscriptions.has(parcelId)) {
        this.parcelSubscriptions.set(parcelId, new Set());
      }
      this.parcelSubscriptions.get(parcelId)?.add(client.id);

      // Join parcel room
      client.join(`parcel:${parcelId}`);

      this.logger.log(`Client ${client.id} subscribed to parcel ${parcelId}`);
      client.emit('subscribed', { parcelId });

    } catch (error) {
      this.logger.error('Error subscribing to parcel:', error);
      client.emit('error', { message: 'Failed to subscribe to parcel' });
    }
  }

  @SubscribeMessage('unsubscribe-parcel')
  handleUnsubscribeParcel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { parcelId: string },
  ) {
    const { parcelId } = data;
    
    // Remove from subscriptions
    this.parcelSubscriptions.get(parcelId)?.delete(client.id);
    if (this.parcelSubscriptions.get(parcelId)?.size === 0) {
      this.parcelSubscriptions.delete(parcelId);
    }

    // Leave parcel room
    client.leave(`parcel:${parcelId}`);

    this.logger.log(`Client ${client.id} unsubscribed from parcel ${parcelId}`);
    client.emit('unsubscribed', { parcelId });
  }

  // Broadcast location update to all subscribers of affected parcels
  async broadcastLocationUpdate(locationUpdate: LocationUpdate) {
    try {
      // Get all parcels affected by this courier's location
      const affectedParcels = await this.prisma.parcel.findMany({
        where: {
          assignedCourierId: locationUpdate.courierId,
          status: { in: ['PICKED', 'IN_TRANSIT'] },
          deletedAt: null,
        },
        select: { id: true },
      });

      // Broadcast to each affected parcel's subscribers
      for (const parcel of affectedParcels) {
        this.server.to(`parcel:${parcel.id}`).emit('location-update', {
          ...locationUpdate,
          parcelId: parcel.id,
        });
      }

      this.logger.log(`Broadcasted location update for courier ${locationUpdate.courierId} to ${affectedParcels.length} parcels`);
    } catch (error) {
      this.logger.error('Error broadcasting location update:', error);
    }
  }

  // Broadcast status update
  broadcastStatusUpdate(statusUpdate: StatusUpdate) {
    this.server.to(`parcel:${statusUpdate.parcelId}`).emit('status-update', statusUpdate);
    this.logger.log(`Broadcasted status update for parcel ${statusUpdate.parcelId}: ${statusUpdate.status}`);
  }

  // Broadcast general parcel update
  broadcastParcelUpdate(parcelId: string, updateData: any) {
    this.server.to(`parcel:${parcelId}`).emit('parcel-update', {
      parcelId,
      ...updateData,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted parcel update for ${parcelId}`);
  }

  // Send notification to specific user
  notifyUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Send update to specific courier
  notifyCourier(courierId: string, update: any) {
    this.server.to(`courier:${courierId}`).emit('courier-update', update);
  }

  private async verifyParcelAccess(parcelId: string, userId: string, role: string): Promise<boolean> {
    try {
      if (role === 'ADMIN') {
        return true; // Admins have access to all parcels
      }

      const parcel = await this.prisma.parcel.findUnique({
        where: { id: parcelId },
        select: {
          senderId: true,
          receiverId: true,
          assignedCourierId: true,
        },
      });

      if (!parcel) {
        return false;
      }

      // Check access based on role
      switch (role) {
        case 'CUSTOMER':
          return parcel.senderId === userId || parcel.receiverId === userId;
        case 'COURIER':
          return parcel.assignedCourierId === userId;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error verifying parcel access:', error);
      return false;
    }
  }
}