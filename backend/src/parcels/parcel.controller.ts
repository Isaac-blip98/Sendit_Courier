import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles-guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { Roles } from 'src/common/decorators/roles-decorator';
import { CreateParcelDto } from './dtos/create-parcel.dto';
import { IParcel } from './interfaces/parcel.interface';
import { UpdateParcelDto } from './dtos/update-parcel.dto';
import { AssignCourierDto } from './dtos/assign-courier.dto';
import { TrackingGateway } from 'src/websockets/tracking.gateway';

@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateParcelDto): Promise<IParcel> {
    return this.parcelService.create(dto);
  }

  @Get()
  findAll(): Promise<IParcel[]> {
    return this.parcelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<IParcel> {
    return this.parcelService.findOne(id);
  }

  @Get(':id/tracking')
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.COURIER)
  async findOneWithTracking(@Param('id') id: string) {
    return this.parcelService.findOneWithTracking(id);
  }

  @Get(':id/events')
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.COURIER)
  async getParcelEvents(@Param('id') id: string) {
    return this.parcelService.getParcelEvents(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateParcelDto,
  ): Promise<IParcel> {
    const updatedParcel = await this.parcelService.update(id, dto);
    // Broadcast status update if status changed
    if (dto.status) {
      this.trackingGateway.broadcastStatusUpdate({
        parcelId: id,
        status: dto.status,
        timestamp: new Date(),
      });
    }
    return updatedParcel;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string): Promise<void> {
    return this.parcelService.softDelete(id);
  }

  // FIXED: Use POST instead of PATCH for assignment to avoid routing conflicts
  @Post('assign')
  @Roles(Role.ADMIN)
  async assignCourier(@Body() dto: AssignCourierDto): Promise<IParcel> {
    console.log('Assign courier endpoint hit with:', dto);
    const updatedParcel = await this.parcelService.assignCourier(
      dto.parcelId,
      dto.courierId,
    );
    // Broadcast parcel update
    this.trackingGateway.broadcastParcelUpdate(dto.parcelId, {
      type: 'courier-assigned',
      courierId: dto.courierId,
    });
    return updatedParcel;
  }

  @Get('user/:userId/all')
  @Roles(Role.CUSTOMER)
  findAllByUser(@Param('userId') userId: string): Promise<IParcel[]> {
    return this.parcelService.findAllByUser(userId);
  }

@Get('courier/:courierId/all')
@Roles(Role.COURIER)
findAllByCourier(@Param('courierId') courierId: string): Promise<IParcel[]> {
  return this.parcelService.findAllByCourier(courierId);
}


  @Get('user/:userId/stats')
  @Roles(Role.CUSTOMER)
  getParcelStats(@Param('userId') userId: string): Promise<any> {
    return this.parcelService.getParcelStats(userId);
  }

  @Patch(':id/location-update')
  @Roles(Role.COURIER)
  async updateLocation(
    @Param('id') parcelId: string,
    @Body() location: { latitude: number; longitude: number },
  ) {
    return this.parcelService.updateCourierLocation(parcelId, location);
  }

  @Patch(':id/unassign')
  @Roles(Role.ADMIN)
  async unassignCourier(@Param('id') parcelId: string): Promise<IParcel> {
    console.log('Unassign courier endpoint hit for parcelId:', parcelId);
    const updatedParcel = await this.parcelService.unassignCourier(parcelId);
    // Broadcast parcel update
    this.trackingGateway.broadcastParcelUpdate(parcelId, {
      type: 'courier-unassigned',
    });
    return updatedParcel;
  }
}