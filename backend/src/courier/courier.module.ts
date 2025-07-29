import { Module } from '@nestjs/common';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TrackingGateway } from 'src/websockets/tracking.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CourierService, TrackingGateway],
  controllers: [CourierController],
})
export class CourierModule {}
