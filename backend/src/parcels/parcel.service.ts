import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IParcel } from './interfaces/parcel.interface';
import { GeoService } from 'src/common/geo/geo.service';
import { UpdateParcelDto } from './dtos/update-parcel.dto';
import { CreateParcelDto } from './dtos/create-parcel.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { ParcelStatus, Role } from '@prisma/client';

export interface ParcelWithTracking extends IParcel {
  trackingPoints: {
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

@Injectable()
export class ParcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly mailerService: MailerService,
  ) {}

  async create(dto: CreateParcelDto): Promise<IParcel> {
    try {
      const pickup = await this.geoService.geocode(dto.pickupAddress);
      const destination = await this.geoService.geocode(dto.destination);

      // Calculate estimated distance
      const distance = this.calculateDistance(
        pickup.lat,
        pickup.lng,
        destination.lat,
        destination.lng,
      );

      return this.prisma.parcel.create({
        data: {
          ...dto,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          destinationLat: destination.lat,
          destinationLng: destination.lng,
          estimatedDistance: distance,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Parcel creation failed');
    }
  }

  async findAll(): Promise<IParcel[]> {
    return this.prisma.parcel.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string): Promise<IParcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedCourier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            currentLat: true,
            currentLng: true,
          },
        },
      },
    });

    if (!parcel || parcel.deletedAt) {
      throw new NotFoundException('Parcel not found');
    }
    return parcel;
  }

  async findOneWithTracking(id: string): Promise<ParcelWithTracking> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedCourier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            currentLat: true,
            currentLng: true,
          },
        },
        trackingPoints: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            address: true,
            timestamp: true,
          },
        },
      },
    });

    if (!parcel || parcel.deletedAt) {
      throw new NotFoundException('Parcel not found');
    }

    // Generate route coordinates for polyline
    const routeCoordinates = this.generateRouteCoordinates(parcel);

    // Get current courier location if assigned
    let currentCourierLocation:
      | { latitude: number; longitude: number; timestamp: Date }
      | undefined = undefined;
    if (
      parcel.assignedCourier?.currentLat &&
      parcel.assignedCourier?.currentLng
    ) {
      currentCourierLocation = {
        latitude: parcel.assignedCourier.currentLat,
        longitude: parcel.assignedCourier.currentLng,
        timestamp: new Date(), // You might want to store actual timestamp
      };
    }

    return {
      ...parcel,
      routeCoordinates,
      currentCourierLocation,
    };
  }

  private generateRouteCoordinates(parcel: any): number[][] {
    const coordinates: number[][] = [];

    // Start with pickup location
    coordinates.push([parcel.pickupLat, parcel.pickupLng]);

    // Add tracking points if any
    if (parcel.trackingPoints && parcel.trackingPoints.length > 0) {
      parcel.trackingPoints.forEach((point) => {
        coordinates.push([point.latitude, point.longitude]);
      });
    }

    // End with destination
    coordinates.push([parcel.destinationLat, parcel.destinationLng]);

    return coordinates;
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id); // Ensure exists

    await this.prisma.parcel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignCourier(parcelId: string, courierId: string): Promise<IParcel> {
    const [parcel, courier] = await Promise.all([
      this.prisma.parcel.findUnique({ where: { id: parcelId } }),
      this.prisma.user.findFirst({ where: { id: courierId, role: 'COURIER' } }),
    ]);

    if (!parcel) throw new NotFoundException('Parcel not found');
    if (!courier) throw new NotFoundException('Courier not found');
    if (!courier.isAvailable)
      throw new BadRequestException('Courier is not available');

    // Update courier's availability
    await this.prisma.user.update({
      where: { id: courierId },
      data: { isAvailable: false },
    });

    // Assign courier to parcel
    const updatedParcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: { assignedCourierId: courierId },
    });

    // Create assignment event
    await this.prisma.parcelEvent.create({
      data: {
        parcelId,
        status: parcel.status as any,
        notes: `Courier ${courier.name} assigned to parcel`,
      },
    });

    // Notify customer
    const customer = await this.prisma.user.findUnique({
      where: { id: parcel.senderId },
    });

    if (customer) {
      await this.mailerService.sendCourierAssignmentEmail(
        courier.email,
        courier.name,
        parcel.id,
      );
    }

    return updatedParcel;
  }

  async findAllByUser(userId: string): Promise<IParcel[]> {
    return this.prisma.parcel.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedCourier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByCourier(courierId: string): Promise<IParcel[]> {
  return this.prisma.parcel.findMany({
    where: {
      assignedCourierId: courierId,
      deletedAt: null,
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}


  async getParcelEvents(parcelId: string): Promise<any[]> {
    return this.prisma.parcelEvent.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getParcelStats(userId: string): Promise<{
    totalParcels: number;
    totalSent: number;
    totalReceived: number;
    statusCounts: {
      pending: number;
      picked: number;
      inTransit: number;
      delivered: number;
      cancelled: number;
    };
  }> {
    const [sentParcels, receivedParcels] = await Promise.all([
      this.prisma.parcel.findMany({
        where: { senderId: userId, deletedAt: null },
        select: { status: true },
      }),
      this.prisma.parcel.findMany({
        where: { receiverId: userId, deletedAt: null },
        select: { status: true },
      }),
    ]);

    const allParcels = [...sentParcels, ...receivedParcels];

    return {
      totalParcels: allParcels.length,
      totalSent: sentParcels.length,
      totalReceived: receivedParcels.length,
      statusCounts: {
        pending: allParcels.filter((p) => p.status === 'PENDING').length,
        picked: allParcels.filter((p) => p.status === 'PICKED').length,
        inTransit: allParcels.filter((p) => p.status === 'IN_TRANSIT').length,
        delivered: allParcels.filter((p) => p.status === 'DELIVERED').length,
        cancelled: allParcels.filter((p) => p.status === 'CANCELLED').length,
      },
    };
  }

  async updateCourierLocation(
    parcelId: string,
    location: { latitude: number; longitude: number },
  ) {
    const parcel = await this.findOne(parcelId);
    if (!parcel.assignedCourierId) {
      throw new BadRequestException('No courier assigned');
    }

    // Save new tracking point using the correct model: ParcelTracking
    await this.prisma.parcelTracking.create({
      data: {
        parcelId,
        courierId: parcel.assignedCourierId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
      },
    });

    // Automatically determine new status
    let newStatus: ParcelStatus | null = null;

    const distanceToPickup = this.calculateDistance(
      location.latitude,
      location.longitude,
      parcel.pickupLat,
      parcel.pickupLng,
    );

    const distanceToDestination = this.calculateDistance(
      location.latitude,
      location.longitude,
      parcel.destinationLat,
      parcel.destinationLng,
    );

    if (distanceToPickup > 0.3 && parcel.status === 'PENDING') {
      newStatus = 'IN_TRANSIT';
    } else if (distanceToDestination < 0.3 && parcel.status === 'IN_TRANSIT') {
      newStatus = 'DELIVERED';
    }

    if (newStatus) {
      await this.prisma.parcel.update({
        where: { id: parcelId },
        data: {
          status: newStatus,
          ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
      });

      await this.prisma.parcelEvent.create({
        data: {
          parcelId,
          status: newStatus,
          notes: 'Auto status update based on courier location',
        },
      });
    }

    return { message: 'Location updated', status: newStatus ?? parcel.status };
  }

  async unassignCourier(parcelId: string): Promise<IParcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: { assignedCourier: true },
    });

    if (!parcel) throw new NotFoundException('Parcel not found');
    if (!parcel.assignedCourierId)
      throw new BadRequestException('No courier assigned to this parcel');

    // Update courier availability back to true
    if (parcel.assignedCourier) {
      await this.prisma.user.update({
        where: { id: parcel.assignedCourierId },
        data: { isAvailable: true },
      });
    }

    // Remove courier assignment
    const updatedParcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        assignedCourierId: null,
        status: 'PENDING',
      },
    });

    // Create unassignment event
    await this.prisma.parcelEvent.create({
      data: {
        parcelId,
        status: 'PENDING' as any,
        notes: `Courier unassigned from parcel`,
      },
    });

    return updatedParcel;
  }

  async update(id: string, dto: UpdateParcelDto): Promise<IParcel> {
    await this.findOne(id); // Ensure exists

    const updateData: any = { ...dto };
    if (dto.status === 'PICKED') {
      updateData.pickedUpAt = new Date();
    }

    const updatedParcel = await this.prisma.parcel.update({
      where: { id },
      data: updateData,
    });

    // Create tracking point if location is provided
    if (dto.location && updatedParcel.assignedCourierId) {
      await this.prisma.parcelTracking.create({
        data: {
          parcelId: id,
          courierId: updatedParcel.assignedCourierId,
          latitude: dto.location.lat,
          longitude: dto.location.lng,
          address: null, // Optionally resolve address using GeoService
          timestamp: new Date(),
        },
      });
    }

    // Create status change event
    if (dto.status) {
      await this.prisma.parcelEvent.create({
        data: {
          parcelId: id,
          status: dto.status as any,
          location: dto.location
            ? {
                latitude: dto.location.lat,
                longitude: dto.location.lng,
              }
            : undefined,
          notes: 'Status updated by courier',
        },
      });
    }

    return updatedParcel;
  }
}
