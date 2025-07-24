// ... (keep your existing imports)
import {
  PrismaClient,
  Role,
  ParcelStatus,
  WeightCategory,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('elvis123', 10); // ← update your new admin password here
  const user1Password = await bcrypt.hash('customer1', 10);
  const user2Password = await bcrypt.hash('customer2', 10);

  await prisma.user.deleteMany({
    where: { email: 'admin@sendit.com' },
  });

  // Create or update admin
  const admin = await prisma.user.upsert({
    where: { email: 'ndiranguelvis97@gmail.com' }, // ← NEW EMAIL
    update: {
      name: 'Elvis',
      phone: '0794130919',
      password: adminPassword,
    },
    create: {
      name: 'Elvis',
      email: 'ndiranguelvis97@gmail.com',
      phone: '0794130919',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create customers (unchanged)
  const customer1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      name: 'Customer One',
      email: 'user1@example.com',
      phone: '0711000001',
      password: user1Password,
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      name: 'Customer Two',
      email: 'user2@example.com',
      phone: '0711000002',
      password: user2Password,
      role: Role.CUSTOMER,
    },
  });

  // Courier (unchanged)
  const courier = await prisma.courier.upsert({
    where: { email: 'courier1@sendit.com' },
    update: {},
    create: {
      name: 'Courier One',
      email: 'courier1@sendit.com',
      phone: '0722000000',
      isAvailable: true,
      currentLat: -1.2921,
      currentLng: 36.8219,
    },
  });

  // Parcels (unchanged)
  await prisma.parcel.createMany({
    data: [
      {
        senderId: customer1.id,
        receiverId: customer2.id,
        assignedCourierId: courier.id,
        receiverName: 'Customer Two',
        receiverPhone: '0711000002',
        pickupAddress: 'Westlands, Nairobi',
        pickupLat: -1.2647,
        pickupLng: 36.8025,
        destination: 'CBD, Nairobi',
        destinationLat: -1.2833,
        destinationLng: 36.8167,
        weightCategory: WeightCategory.MEDIUM,
        status: ParcelStatus.PENDING,
      },
      {
        senderId: customer2.id,
        receiverId: customer1.id,
        assignedCourierId: courier.id,
        receiverName: 'Customer One',
        receiverPhone: '0711000001',
        pickupAddress: 'Karen, Nairobi',
        pickupLat: -1.3124,
        pickupLng: 36.7219,
        destination: 'Parklands, Nairobi',
        destinationLat: -1.2667,
        destinationLng: 36.8,
        weightCategory: WeightCategory.HEAVY,
        status: ParcelStatus.IN_TRANSIT,
      },
    ],
  });

  console.log(
    'Seed data updated: admin credentials, 2 users, courier, parcels',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
