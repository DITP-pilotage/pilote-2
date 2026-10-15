-- PIL-1907 : rationalisation du paramétrage du calcul des VACA/VACG
-- (param_vaca_* / param_vacg_*) avec ce que calcule dbt (compute_vaca, compute_vacg).

-- 1. Opération : la moyenne n'est plus proposée (jamais utilisée, et dbt ne
-- connaissait que `moy` quand PILOTE proposait `avg`), et `_` ou une valeur
-- vide deviennent `current_value`, ce que dbt appliquait déjà.
UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vaca_op" = 'current_value'
WHERE "param_vaca_op" IS NULL OR "param_vaca_op" IN ('', '_');

UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vacg_op" = 'current_value'
WHERE "param_vacg_op" IS NULL OR "param_vacg_op" IN ('', '_');

DELETE FROM "public"."metadata_indicateur_valeur_acceptee"
WHERE "metadata_indicateur_name" IN ('param_vaca_op', 'param_vacg_op')
  AND "valeur" IN ('', 'avg');

UPDATE "public"."metadata_indicateur"
SET "default_value" = 'current_value'
WHERE "name" IN ('param_vaca_op', 'param_vacg_op');

-- 2. `from_custom_date::AAAA-MM-JJ` devient `from_beginning` : dbt ignorait la
-- date (partition sur une constante, donc sur tout l'historique).
UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vaca_decumul_from" = 'from_beginning'
WHERE "param_vaca_decumul_from" LIKE 'from_custom_date::%';

UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vaca_partition_date" = 'from_beginning'
WHERE "param_vaca_partition_date" LIKE 'from_custom_date::%';

UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vacg_decumul_from" = 'from_beginning'
WHERE "param_vacg_decumul_from" LIKE 'from_custom_date::%';

UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vacg_partition_date" = 'from_beginning'
WHERE "param_vacg_partition_date" LIKE 'from_custom_date::%';

UPDATE "public"."metadata_indicateur_valeur_acceptee"
SET "valeur" = 'from_beginning'
WHERE "metadata_indicateur_name" IN (
    'param_vaca_decumul_from',
    'param_vaca_partition_date',
    'param_vacg_decumul_from',
    'param_vacg_partition_date'
  )
  AND "valeur" LIKE 'from_custom_date::%';

-- 3. Seules les valeurs calculées par dbt sont acceptées à la saisie
-- (formulaire et import en masse).
UPDATE "public"."metadata_indicateur"
SET "validation_regex" = '^(_|from_year_start|from_beginning)$',
    "validation_regex_error_message" = 'Le décumul doit valoir ''_'', ''from_year_start'' ou ''from_beginning'''
WHERE "name" IN ('param_vaca_decumul_from', 'param_vacg_decumul_from');

UPDATE "public"."metadata_indicateur"
SET "validation_regex" = '^(_|from_year_start|from_beginning|from_previous_month::12)$',
    "validation_regex_error_message" = 'Le cumul doit valoir ''_'', ''from_year_start'', ''from_beginning'' ou ''from_previous_month::12'''
WHERE "name" IN ('param_vaca_partition_date', 'param_vacg_partition_date');

UPDATE "public"."metadata_indicateur"
SET "validation_regex" = '^(current_value|sum)$',
    "validation_regex_error_message" = 'L''opération doit valoir ''current_value'' ou ''sum'''
WHERE "name" IN ('param_vaca_op', 'param_vacg_op');

-- 4. Plus de paramétrage NULL : avec un décumul NULL, dbt décumulait
-- implicitement tout l'historique ; avec un cumul NULL, la VAC était NULL.
-- Aucune valeur NULL n'a été constatée lors de l'audit.
UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET "param_vaca_decumul_from" = COALESCE("param_vaca_decumul_from", '_'),
    "param_vaca_partition_date" = COALESCE("param_vaca_partition_date", '_'),
    "param_vacg_decumul_from" = COALESCE("param_vacg_decumul_from", '_'),
    "param_vacg_partition_date" = COALESCE("param_vacg_partition_date", '_')
WHERE "param_vaca_decumul_from" IS NULL
   OR "param_vaca_partition_date" IS NULL
   OR "param_vacg_decumul_from" IS NULL
   OR "param_vacg_partition_date" IS NULL;

-- La clé étrangère vers metadata_indicateurs_hidden est différée : ses
-- vérifications en attente suite aux UPDATE ci-dessus empêcheraient l'ALTER TABLE.
SET CONSTRAINTS "raw_data"."fk_indicateur_parametrage_hidden" IMMEDIATE;

ALTER TABLE "raw_data"."metadata_parametrage_indicateurs"
    ALTER COLUMN "param_vaca_decumul_from" SET DEFAULT '_',
    ALTER COLUMN "param_vaca_decumul_from" SET NOT NULL,
    ALTER COLUMN "param_vaca_partition_date" SET DEFAULT '_',
    ALTER COLUMN "param_vaca_partition_date" SET NOT NULL,
    ALTER COLUMN "param_vaca_op" SET DEFAULT 'current_value',
    ALTER COLUMN "param_vaca_op" SET NOT NULL,
    ALTER COLUMN "param_vacg_decumul_from" SET DEFAULT '_',
    ALTER COLUMN "param_vacg_decumul_from" SET NOT NULL,
    ALTER COLUMN "param_vacg_partition_date" SET DEFAULT '_',
    ALTER COLUMN "param_vacg_partition_date" SET NOT NULL,
    ALTER COLUMN "param_vacg_op" SET DEFAULT 'current_value',
    ALTER COLUMN "param_vacg_op" SET NOT NULL;
