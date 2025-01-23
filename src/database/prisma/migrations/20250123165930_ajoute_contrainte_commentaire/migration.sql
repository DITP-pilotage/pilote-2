update commentaire set code_insee = '01' where code_insee = '1';
update commentaire set code_insee = '02' where code_insee = '2';
update commentaire set code_insee = '03' where code_insee = '3';
update commentaire set code_insee = '04' where code_insee = '4';
update commentaire set code_insee = '05' where code_insee = '5';
update commentaire set code_insee = '06' where code_insee = '6';
update commentaire set code_insee = '07' where code_insee = '7';
update commentaire set code_insee = '08' where code_insee = '8';
update commentaire set code_insee = '09' where code_insee = '9';

update synthese_des_resultats set code_insee = '01' where code_insee = '1';
update synthese_des_resultats set code_insee = '02' where code_insee = '2';
update synthese_des_resultats set code_insee = '03' where code_insee = '3';
update synthese_des_resultats set code_insee = '04' where code_insee = '4';
update synthese_des_resultats set code_insee = '05' where code_insee = '5';
update synthese_des_resultats set code_insee = '06' where code_insee = '6';
update synthese_des_resultats set code_insee = '07' where code_insee = '7';
update synthese_des_resultats set code_insee = '08' where code_insee = '8';
update synthese_des_resultats set code_insee = '09' where code_insee = '9';

delete from objectif c where chantier_id not in (
    select id from chantier_identite
);

delete from commentaire c where chantier_id not in (
    select id from chantier_identite
);

delete from synthese_des_resultats c where chantier_id not in (
    select id from chantier_identite
);

delete from decision_strategique c where chantier_id not in (
    select id from chantier_identite
);

-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN  "territoire_code" TEXT;

UPDATE "public"."commentaire" SET territoire_code = CONCAT(maille, '-', code_insee);

ALTER TABLE "public"."commentaire" ALTER COLUMN "territoire_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN     "territoire_code" TEXT;

UPDATE "public"."synthese_des_resultats" SET territoire_code = CONCAT(maille, '-', code_insee);

ALTER TABLE "public"."synthese_des_resultats" ALTER COLUMN "territoire_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

