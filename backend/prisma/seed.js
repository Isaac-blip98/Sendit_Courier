"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminPassword = await bcrypt.hash('elvis123', 10);
    const password1 = await bcrypt.hash('password1', 10);
    const password2 = await bcrypt.hash('password2', 10);
    const password3 = await bcrypt.hash('password3', 10);
    const courierPassword = await bcrypt.hash('courier123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'ndiranguelvis97@gmail.com' },
        update: {
            name: 'Elvis',
            phone: '0794130919',
            password: adminPassword,
        },
        create: {
            name: 'Elvis',
            email: 'ndiranguelvis97@gmail.com',
            password: adminPassword,
            phone: '0794130919',
            role: client_1.Role.ADMIN,
        },
    });
    const customers = await Promise.all([
        prisma.user.upsert({
            where: { email: 'alice@example.com' },
            update: { password: password1 },
            create: {
                name: 'Alice Mwangi',
                email: 'alice@example.com',
                password: password1,
                phone: '0700111222',
                role: client_1.Role.CUSTOMER,
            },
        }),
        prisma.user.upsert({
            where: { email: 'brian@example.com' },
            update: { password: password2 },
            create: {
                name: 'Brian Otieno',
                email: 'brian@example.com',
                password: password2,
                phone: '0700333444',
                role: client_1.Role.CUSTOMER,
            },
        }),
        prisma.user.upsert({
            where: { email: 'catherine@example.com' },
            update: { password: password3 },
            create: {
                name: 'Catherine Wambui',
                email: 'catherine@example.com',
                password: password3,
                phone: '0700555666',
                role: client_1.Role.CUSTOMER,
            },
        }),
    ]);
    const courier1 = await prisma.user.upsert({
        where: { email: 'david@courier.com' },
        update: { password: courierPassword },
        create: {
            name: 'David Courier',
            email: 'david@courier.com',
            password: courierPassword,
            phone: '0700777888',
            role: client_1.Role.COURIER,
            isAvailable: true,
            currentLat: -1.287,
            currentLng: 36.820,
            locationHistory: {
                create: {
                    latitude: -1.287,
                    longitude: 36.820,
                    address: 'Westlands',
                },
            },
        },
    });
    const courier2 = await prisma.user.upsert({
        where: { email: 'emily@courier.com' },
        update: { password: courierPassword },
        create: {
            name: 'Emily Rider',
            email: 'emily@courier.com',
            password: courierPassword,
            phone: '0700999000',
            role: client_1.Role.COURIER,
            isAvailable: true,
            currentLat: -1.292,
            currentLng: 36.826,
            locationHistory: {
                create: {
                    latitude: -1.292,
                    longitude: 36.826,
                    address: 'Kilimani',
                },
            },
        },
    });
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    const brian = await prisma.user.findUnique({ where: { email: 'brian@example.com' } });
    const catherine = await prisma.user.findUnique({ where: { email: 'catherine@example.com' } });
    const existingParcels = await prisma.parcel.findMany();
    if (existingParcels.length === 0) {
        await prisma.parcel.createMany({
            data: [
                {
                    senderId: alice.id,
                    receiverId: brian.id,
                    assignedCourierId: courier1.id,
                    receiverName: 'Brian Otieno',
                    receiverPhone: '0700333444',
                    pickupAddress: 'Thika Road',
                    pickupLat: -1.254,
                    pickupLng: 36.839,
                    destination: 'CBD, Nairobi',
                    destinationLat: -1.286,
                    destinationLng: 36.817,
                    weightCategory: client_1.WeightCategory.LIGHT,
                },
                {
                    senderId: brian.id,
                    receiverId: catherine.id,
                    assignedCourierId: courier2.id,
                    receiverName: 'Catherine Wambui',
                    receiverPhone: '0700555666',
                    pickupAddress: 'South B',
                    pickupLat: -1.300,
                    pickupLng: 36.850,
                    destination: 'Westlands',
                    destinationLat: -1.265,
                    destinationLng: 36.802,
                    weightCategory: client_1.WeightCategory.MEDIUM,
                },
                {
                    senderId: catherine.id,
                    receiverId: alice.id,
                    receiverName: 'Alice Mwangi',
                    receiverPhone: '0700111222',
                    pickupAddress: 'Ngong Road',
                    pickupLat: -1.310,
                    pickupLng: 36.790,
                    destination: 'Karen',
                    destinationLat: -1.327,
                    destinationLng: 36.712,
                    weightCategory: client_1.WeightCategory.HEAVY,
                },
            ],
        });
    }
    console.log('✅ Seed complete.');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map