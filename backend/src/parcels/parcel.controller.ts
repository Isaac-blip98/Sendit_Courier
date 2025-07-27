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

@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelController {
  constructor(private readonly parcelService: ParcelService) {}

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

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateParcelDto,
  ): Promise<IParcel> {
    return this.parcelService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string): Promise<void> {
    return this.parcelService.softDelete(id);
  }

  @Patch('assign')
  @Roles(Role.ADMIN)
  assignCourier(@Body() dto: AssignCourierDto): Promise<IParcel> {
    return this.parcelService.assignCourier(dto.parcelId, dto.courierId);
  }

  @Get('user/:userId/all')
  @Roles(Role.CUSTOMER)
  findAllByUser(@Param('userId') userId: string): Promise<IParcel[]> {
    return this.parcelService.findAllByUser(userId);
  }

  @Get('user/:userId/stats')
  @Roles(Role.CUSTOMER)
  getParcelStats(@Param('userId') userId: string): Promise<any> {
    return this.parcelService.getParcelStats(userId);
  }
}
