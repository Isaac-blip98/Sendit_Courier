import { Controller, Get, UseGuards, Body, Param, Patch, Delete } from '@nestjs/common';
import { ParcelService } from '../parcels/parcel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../common/guards/roles-guard';
import { Roles } from '../common/decorators/roles-decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { UpdateUserDto } from '../user/dtos/update-user.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDashboardController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  @Get('parcels')
  async getParcels() {
    const parcels = await this.parcelService.findAll();
    return parcels.map(parcel => {
      const iso = parcel.createdAt instanceof Date ? parcel.createdAt.toISOString() : String(parcel.createdAt);
      const [date, timeWithMs] = iso.split('T');
      const time = timeWithMs ? timeWithMs.slice(0, 8) : '';
      return {
        orderNumber: parcel.id,
        date,
        time,
        customer: parcel.receiverName,
        destination: parcel.destination,
        pickupLocation: parcel.pickupAddress,
      };
    });
  }

  @Get('stats')
  async getStats() {
    const [totalUsers, totalParcels, totalPending] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.parcel.count({ where: { deletedAt: null } }),
      this.prisma.parcel.count({ where: { status: 'PENDING', deletedAt: null } }),
    ]);
    return {
      totalUsers,
      totalParcels,
      totalPending,
    };
  }

  @Get('users')
  async getUsers() {
    const users = await this.userService.findAll();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.profileImage || '/assets/default-avatar.jpg',
      joinedDate: user.createdAt,
      status: user.deletedAt ? 'inactive' : 'active',
    }));
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }
} 