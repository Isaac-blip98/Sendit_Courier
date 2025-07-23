import { Role } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  profileImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
