import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
  ],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class WebsocketsModule {}
