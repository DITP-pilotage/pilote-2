-- CreateTable
CREATE TABLE "public"."mb_sync_execution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "derniere_date_sync" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mb_sync_execution_pkey" PRIMARY KEY ("id")
);
