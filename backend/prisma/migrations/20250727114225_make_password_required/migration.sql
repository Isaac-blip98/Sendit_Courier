/*
  Warnings:

  - Made the column `password` on table `Courier` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Courier" ALTER COLUMN "password" SET NOT NULL;
