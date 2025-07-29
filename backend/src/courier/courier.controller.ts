import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { RolesGuard } from 'src/common/guards/roles-guard';
import { Roles } from 'src/common/decorators/roles-decorator';
import { Role } from '@prisma/client';
import { UpdateCourierDto } from './dtos/update-courier.dto';
import { CreateCourierDto } from './dtos/create-courier.dto';
import { CourierService, UpdateLocationDto } from './courier.service';

@Controller('couriers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCourierDto) {
    return this.courierService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.courierService.findAll();
  }

  // FIXED: Move this route BEFORE the :id route to avoid conflicts
  @Get('available')
  @Roles(Role.ADMIN)
  getAvailableCouriers() {
    return this.courierService.getAvailableCouriers();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COURIER)
  findOne(@Param('id') id: string) {
    return this.courierService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCourierDto) {
    return this.courierService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.courierService.softDelete(id);
  }

  @Patch(':id/location')
  @Roles(Role.ADMIN, Role.COURIER)
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.courierService.updateLocation(id, dto);
  }

  @Get(':id/location-history')
  @Roles(Role.ADMIN, Role.COURIER)
  getLocationHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.courierService.getLocationHistory(id, limitNum);
  }

  @Patch(':id/availability')
  @Roles(Role.ADMIN)
  updateAvailability(
    @Param('id') id: string,
    @Body() body: { isAvailable: boolean },
  ) {
    return this.courierService.updateAvailability(id, body.isAvailable);
  }
}