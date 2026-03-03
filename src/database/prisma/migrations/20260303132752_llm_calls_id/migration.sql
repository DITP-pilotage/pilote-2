/*
  Warnings:

  - The primary key for the `llm_calls` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."llm_calls" DROP CONSTRAINT "llm_calls_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "llm_calls_pkey" PRIMARY KEY ("id");
