import { Module } from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module'; // GeoService
import { AppMailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [PrismaModule, CommonModule, AppMailerModule],
  providers: [ParcelService],
  controllers: [ParcelController],
})
export class ParcelModule {}
