-- CreateTable
CREATE TABLE "public"."referentiel_rattachement_groupe" (
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referentiel_rattachement_groupe_pkey" PRIMARY KEY ("code")
);

INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-84', 'Auvergne-Rhône-Alpes', 1) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-27', 'Bourgogne-Franche-Comté', 2) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-53', 'Bretagne', 3) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-24', 'Centre-Val de Loire', 4) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-94', 'Corse', 5) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-44', 'Grand-Est', 6) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-32', 'Hauts-de-France', 7) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-28', 'Normandie', 8) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-75', 'Nouvelle Aquitaine', 9) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-76', 'Occitanie', 10) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-52', 'Pays de la Loire', 11) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-93', 'Provence - Alpes - Côte d''Azur', 12) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('REG-11', 'Île-de-France', 13) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('DROM', 'Outre-mer', 14) ON CONFLICT (code) DO NOTHING;
INSERT INTO "public"."referentiel_rattachement_groupe" ("code", "libelle", "ordre") VALUES ('PP', 'Préfectures de police', 15) ON CONFLICT (code) DO NOTHING;

UPDATE "public"."referentiel_rattachement" SET "groupe" = 'DROM' WHERE "code" IN (
    'REG-01',
    'REG-02',
    'REG-03',
    'REG-04',
    'REG-06',
    'DEPT-976',
    'DEPT-974',
    'DEPT-973',
    'DEPT-972',
    'DEPT-971'
);
