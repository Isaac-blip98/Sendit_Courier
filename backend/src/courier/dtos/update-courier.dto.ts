import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateCourierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}
