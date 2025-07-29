import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourierDto } from './dtos/create-courier.dto';
import { UpdateCourierDto } from './dtos/update-courier.dto';
import { TrackingGateway } from 'src/websockets/tracking.gateway';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export interface UpdateLocationDto {
  latitude: number;
  longitude: number;
  address?: string;
}

@Injectable()
export class CourierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateCourierDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Courier with that email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        ...dto,
        role: Role.COURIER,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        role: Role.COURIER,
        deletedAt: null,
      },
      include: {
        assignedParcels: {
          where: {
            status: { in: ['PICKED', 'IN_TRANSIT'] },
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destination: true,
            receiverName: true,
            receiverPhone: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const courier = await this.prisma.user.findUnique({
      where: { id },
      include: {
        assignedParcels: {
          where: {
            status: { in: ['PICKED', 'IN_TRANSIT'] },
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destination: true,
            receiverName: true,
            receiverPhone: true,
          },
        },
      },
    });

    if (!courier || courier.role !== Role.COURIER || courier.deletedAt) {
      throw new NotFoundException('Courier not found');
    }

    return courier;
  }

  async update(id: string, dto: UpdateCourierDto) {
    await this.findOne(id); // ensure exists
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateLocation(id: string, locationDto: UpdateLocationDto) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        currentLat: locationDto.latitude,
        currentLng: locationDto.longitude,
      },
    });

    await this.prisma.courierLocation.create({
      data: {
        courierId: id,
        latitude: locationDto.latitude,
        longitude: locationDto.longitude,
        address: locationDto.address,
      },
    });

    const assignedParcels = await this.prisma.parcel.findMany({
      where: {
        assignedCourierId: id,
        status: { in: ['PICKED', 'IN_TRANSIT'] },
        deletedAt: null,
      },
    });

    const updatedParcelIds: string[] = [];

    for (const parcel of assignedParcels) {
      await this.prisma.parcelTracking.create({
        data: {
          parcelId: parcel.id,
          courierId: id,
          latitude: locationDto.latitude,
          longitude: locationDto.longitude,
          address: locationDto.address,
        },
      });

      const updatedStatus = await this.calculateParcelStatus(parcel, locationDto);

      if (updatedStatus && updatedStatus !== parcel.status) {
        await this.prisma.parcel.update({
          where: { id: parcel.id },
          data: {
            status: updatedStatus as any,
            ...(updatedStatus === 'DELIVERED' && { deliveredAt: new Date() }),
          },
        });

        await this.prisma.parcelEvent.create({
          data: {
            parcelId: parcel.id,
            status: updatedStatus as any,
            location: {
              latitude: locationDto.latitude,
              longitude: locationDto.longitude,
              address: locationDto.address,
            },
            notes: `Status automatically updated`,
          },
        });

        this.trackingGateway.broadcastStatusUpdate({
          parcelId: parcel.id,
          status: updatedStatus,
          location: {
            latitude: locationDto.latitude,
            longitude: locationDto.longitude,
            address: locationDto.address,
          },
          timestamp: new Date(),
        });

        updatedParcelIds.push(parcel.id);
      }
    }

    this.trackingGateway.broadcastLocationUpdate({
      parcelId: '',
      courierId: id,
      latitude: locationDto.latitude,
      longitude: locationDto.longitude,
      address: locationDto.address,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Location updated successfully',
      updatedParcels: updatedParcelIds,
    };
  }

  async getLocationHistory(id: string, limit = 50) {
    await this.findOne(id);
    return this.prisma.courierLocation.findMany({
      where: { courierId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  private async calculateParcelStatus(parcel: any, location: UpdateLocationDto): Promise<string | null> {
    const PROXIMITY_THRESHOLD = 0.1;
    const distanceFromPickup = this.calculateDistance(parcel.pickupLat, parcel.pickupLng, location.latitude, location.longitude);
    const distanceFromDestination = this.calculateDistance(parcel.destinationLat, parcel.destinationLng, location.latitude, location.longitude);

    if (parcel.status === 'PICKED' && distanceFromPickup > PROXIMITY_THRESHOLD) return 'IN_TRANSIT';
    if (parcel.status === 'IN_TRANSIT' && distanceFromDestination <= PROXIMITY_THRESHOLD) return 'DELIVERED';
    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  
async getAvailableCouriers() {
  return this.prisma.user.findMany({
    where: {
      role: Role.COURIER,
      deletedAt: null,
      isAvailable: true,
    },
    include: {
      assignedParcels: {
        where: {
          status: { in: ['PICKED', 'IN_TRANSIT'] },
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          destination: true,
          receiverName: true,
          receiverPhone: true,
        },
      },
    },
  });
}

async updateAvailability(id: string, isAvailable: boolean) {
  await this.findOne(id); // ensure exists
  return this.prisma.user.update({
    where: { id },
    data: { isAvailable },
  });
}
}
