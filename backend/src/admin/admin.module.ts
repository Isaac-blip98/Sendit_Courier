import { Module } from '@nestjs/common';
import { ParcelModule } from '../parcels/parcel.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ParcelModule, UserModule],
  controllers: [AdminDashboardController],
  providers: [PrismaService]
})
export class AdminModule {} 