import { ParcelStatus, WeightCategory } from '@prisma/client';

export interface IParcel {
  id: string;
  senderId: string;
  receiverId: string;
  assignedCourierId?: string | null;

  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  weightCategory: WeightCategory;
  status: ParcelStatus;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
