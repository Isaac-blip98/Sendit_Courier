-- AlterEnum
ALTER TYPE "ParcelStatus" ADD VALUE 'PICKED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COURIER';

-- AlterTable
ALTER TABLE "Parcel" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDistance" DOUBLE PRECISION,
ADD COLUMN     "pickedUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ParcelEvent" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "ParcelTracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParcelTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierLocation" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourierLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParcelTracking_parcelId_idx" ON "ParcelTracking"("parcelId");

-- CreateIndex
CREATE INDEX "ParcelTracking_timestamp_idx" ON "ParcelTracking"("timestamp");

-- CreateIndex
CREATE INDEX "CourierLocation_courierId_idx" ON "CourierLocation"("courierId");

-- CreateIndex
CREATE INDEX "CourierLocation_timestamp_idx" ON "CourierLocation"("timestamp");

-- AddForeignKey
ALTER TABLE "ParcelTracking" ADD CONSTRAINT "ParcelTracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierLocation" ADD CONSTRAINT "CourierLocation_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
