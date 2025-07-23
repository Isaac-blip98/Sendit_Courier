import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ParcelModule } from './parcels/parcel.module';
import { CourierController } from './courier/courier.controller';
import { CourierService } from './courier/courier.service';
import { CourierModule } from './courier/courier.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    ParcelModule,
    CourierModule,
  ],
  controllers: [AppController, CourierController],
  providers: [AppService, CourierService],
})
export class AppModule {}
