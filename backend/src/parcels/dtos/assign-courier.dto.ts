import { IsUUID } from 'class-validator';

export class AssignCourierDto {
  @IsUUID()
  parcelId: string;

  @IsUUID()
  courierId: string;
}
