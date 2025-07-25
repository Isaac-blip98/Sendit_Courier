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
import { MailerController } from './mailer/mailer.controller';
import { MailerService } from './mailer/mailer.service';
import { AppMailerModule } from './mailer/mailer.module';
import { ParcelEventsController } from './parcel-events/parcel-events.controller';
import { ParcelEventsModule } from './parcel-events/parcel-events.module';
import { ParcelEventsService } from './parcel-events/parcel-events.service';
import { AdminModule } from './admin/admin.module';

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
    AppMailerModule,
    ParcelEventsModule,
    AdminModule,
  ],
  controllers: [AppController, CourierController, MailerController, ParcelEventsController, ParcelEventsController],
  providers: [AppService, CourierService, MailerService, ParcelEventsService],
})
export class AppModule {}
