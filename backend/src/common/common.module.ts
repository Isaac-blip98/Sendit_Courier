import { Module } from '@nestjs/common';
import { GeoService } from './geo/geo.service';

@Module({
  providers: [GeoService],
  exports: [GeoService],
})
export class CommonModule {}
