export interface ICourier {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  currentLat: number | null;
  currentLng: number | null;
  createdAt: Date;
  updatedAt: Date;
}
