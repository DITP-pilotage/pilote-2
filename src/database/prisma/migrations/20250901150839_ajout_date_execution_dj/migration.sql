-- CreateTable
CREATE TABLE "public"."datajobs_execution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "derniere_date_execution" TIME NOT NULL,

    CONSTRAINT "datajobs_execution_pkey" PRIMARY KEY ("id")
);
