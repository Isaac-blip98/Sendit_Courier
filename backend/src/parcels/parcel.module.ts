import { Module } from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module'; // GeoService

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [ParcelService],
  controllers: [ParcelController],
})
export class ParcelModule {}
