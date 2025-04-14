-- CreateTable
CREATE TABLE "public"."nouveaute" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "nouveautes_pkey" PRIMARY KEY ("id")
);
