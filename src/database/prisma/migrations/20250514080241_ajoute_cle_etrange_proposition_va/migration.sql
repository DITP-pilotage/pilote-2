-- AlterTable
ALTER TABLE "public"."nouveaute" RENAME CONSTRAINT "nouveautes_pkey" TO "nouveaute_pkey";

-- AlterTable
ALTER TABLE "public"."proposition_valeur_actuelle" ALTER COLUMN "id_auteur_modification" TYPE UUID USING id_auteur_modification::uuid;

-- AddForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" ADD CONSTRAINT "proposition_valeur_actuelle_id_auteur_modification_fkey" FOREIGN KEY ("id_auteur_modification") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
