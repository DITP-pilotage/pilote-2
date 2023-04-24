-- CreateTable
CREATE TABLE "public"."utilisateur_perimetre" (
    "utilisateur_id" UUID NOT NULL,
    "perimetre_id" TEXT NOT NULL,

    CONSTRAINT "utilisateur_perimetre_pkey" PRIMARY KEY ("utilisateur_id","perimetre_id")
);

-- AddForeignKey
ALTER TABLE "public"."utilisateur_perimetre" ADD CONSTRAINT "utilisateur_perimetre_perimetre_id_fkey" FOREIGN KEY ("perimetre_id") REFERENCES "public"."perimetre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
