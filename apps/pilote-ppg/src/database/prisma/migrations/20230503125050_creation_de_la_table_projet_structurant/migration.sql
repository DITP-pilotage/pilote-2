-- CreateTable
CREATE TABLE "public"."projet_structurant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "direction_administration" TEXT[],
    "ministeres" TEXT[],
    "chefferie_de_projet" TEXT[],
    "co_porteur" TEXT[],

    CONSTRAINT "projet_structurant_pkey" PRIMARY KEY ("id")
);
