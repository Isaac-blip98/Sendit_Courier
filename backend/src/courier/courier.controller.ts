import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { RolesGuard } from 'src/common/guards/roles-guard';
import { Roles } from 'src/common/decorators/roles-decorator';
import { Role } from '@prisma/client';
import { ICourier } from './interfaces/courier.interface';
import { UpdateCourierDto } from './dtos/update-courier.dto';
import { CreateCourierDto } from './dtos/create-courier.dto';
import { CourierService } from './courier.service';

@Controller('couriers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post()
  create(@Body() dto:CreateCourierDto): Promise<ICourier> {
    return this.courierService.create(dto);
  }

  @Get()
  findAll(): Promise<ICourier[]> {
    return this.courierService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ICourier> {
    return this.courierService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourierDto,
  ): Promise<ICourier> {
    return this.courierService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.courierService.softDelete(id);
  }
}
