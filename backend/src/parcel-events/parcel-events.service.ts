import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelEventDto } from './dtos/create-parcel-events.dto';

@Injectable()
export class ParcelEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(parcelId: string, dto: CreateParcelEventDto) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!parcel || parcel.deletedAt) throw new NotFoundException('Parcel not found');

    return this.prisma.parcelEvent.create({
      data: {
        parcelId,
        status: dto.status,
        location: dto.location,
      },
    });
  }

  async getEvents(parcelId: string) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!parcel || parcel.deletedAt) throw new NotFoundException('Parcel not found');

    return this.prisma.parcelEvent.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
