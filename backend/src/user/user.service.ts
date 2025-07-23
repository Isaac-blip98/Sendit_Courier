import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User as IUser } from './interface/user.interface';


@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<IUser[]> {
    return this.prisma.user.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string): Promise<IUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<IUser> {
    await this.findOne(id); // ensure existence
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });
  }

  async softDelete(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'User deleted successfully (soft delete)' };
  }
}
