import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ParcelStatus } from '@prisma/client';

export class UpdateParcelDto {
  @IsEnum(ParcelStatus)
  @IsOptional()
  status?: ParcelStatus;

  @IsUUID()
  @IsOptional()
  assignedCourierId?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  pickupAddress?: string;
}
