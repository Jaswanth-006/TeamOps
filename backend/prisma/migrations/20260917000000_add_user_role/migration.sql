-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FACULTY', 'STUDENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT';
