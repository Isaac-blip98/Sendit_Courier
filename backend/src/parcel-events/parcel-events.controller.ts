import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ParcelEventsService } from './parcel-events.service';
import { CreateParcelEventDto } from './dtos/create-parcel-events.dto';

@Controller('parcels/:parcelId/events')
export class ParcelEventsController {
  constructor(private readonly service: ParcelEventsService) {}

  @Post()
  create(
    @Param('parcelId') parcelId: string,
    @Body() dto: CreateParcelEventDto,
  ) {
    return this.service.create(parcelId, dto);
  }

  @Get()
  getEvents(@Param('parcelId') parcelId: string) {
    return this.service.getEvents(parcelId);
  }
}
