import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { WeightCategory } from '@prisma/client';

export class CreateParcelDto {
  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  receiverName: string;

  @IsString()
  @IsNotEmpty()
  receiverPhone: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsEnum(WeightCategory)
  weightCategory: WeightCategory;

  // assignedCourierId is optional at creation
  @IsUUID()
  @IsOptional()
  assignedCourierId?: string;
}
