-- CreateEnum
CREATE TYPE "api_key_role_enum" AS ENUM ('CONTRIBUTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "api_key" ADD COLUMN     "role" "api_key_role_enum" NOT NULL DEFAULT 'CONTRIBUTOR';
