import { Module } from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module'; // GeoService
import { AppMailerModule } from 'src/mailer/mailer.module';
import { TrackingGateway } from 'src/websockets/tracking.gateway';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [PrismaModule, CommonModule, AppMailerModule, AuthModule],
  providers: [ParcelService, TrackingGateway],
  controllers: [ParcelController],
  exports: [ParcelService]
})
export class ParcelModule {}
