import { IsEnum, IsJSON, IsObject, IsOptional, IsString } from 'class-validator';
import { ParcelStatus } from '@prisma/client';

export class CreateParcelEventDto {
  @IsEnum(ParcelStatus)
  status: ParcelStatus;

  @IsObject()
  @IsOptional()
  location?: {
    lat: number;
    lng: number;
    label?: string;
  };
}
