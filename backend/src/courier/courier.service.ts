import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourierDto } from './dtos/create-courier.dto';
import { ICourier } from './interfaces/courier.interface';
import { UpdateCourierDto } from './dtos/update-courier.dto';

@Injectable()
export class CourierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourierDto): Promise<ICourier> {
    return this.prisma.courier.create({ data: dto });
  }

  async findAll(): Promise<ICourier[]> {
    return this.prisma.courier.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string): Promise<ICourier> {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
    });
    if (!courier || courier.deletedAt) {
      throw new NotFoundException('Courier not found');
    }
    return courier;
  }

  async update(id: string, dto: UpdateCourierDto): Promise<ICourier> {
    const courier = await this.findOne(id);
    return this.prisma.courier.update({
      where: { id: courier.id },
      data: dto,
    });
  }

  async softDelete(id: string): Promise<void> {
    const courier = await this.findOne(id);
    await this.prisma.courier.update({
      where: { id: courier.id },
      data: { deletedAt: new Date() },
    });
  }
}
