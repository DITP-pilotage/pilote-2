#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW_DATA_SEED_DIR="raw_data"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load E2E environment variables
set -a
source "$PROJECT_ROOT/.env.e2e"
set +a

psql -q -d "$DATABASE_URL" <<EOF
SET client_min_messages = WARNING;
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS raw_data CASCADE;
EOF

psql -q -d "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql"

cd "$PROJECT_ROOT"
npx ts-node src/database/prisma/seed.ts
npx ts-node scripts/seedUtilisateursTest.ts


# Tables sans dependances
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_axes FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_axes.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_ppgs FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_ppgs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantier_meteos FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_chantier_meteos.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantiers FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_chantiers.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_engagement FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_engagement.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateur_types FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_indicateur_types.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_perimetres FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_perimetres.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_porteurs FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_porteurs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zonegroup FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_zonegroup.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zones FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_zones.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependance sur indicateurs (ordre important)
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_indicateurs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_parametrage_indicateurs FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_parametrage_indicateurs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs_complementaire FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_indicateurs_complementaire.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs_hidden FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_indicateurs_hidden.csv' WITH (FORMAT csv, HEADER true)"

# Table des rapports d'import (doit être chargée avant mesure_indicateur)
psql -q -d "$DATABASE_URL" -c "\COPY public.rapport_import_mesure_indicateur FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/rapport_import_mesure_indicateur.csv' WITH (FORMAT csv, HEADER true)"

# Table finale
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.mesure_indicateur FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/mesure_indicateur.csv' WITH (FORMAT csv, HEADER true)"

PUBLIC_SEED_DIR="public"

# Tables sans dependances
psql -q -d "$DATABASE_URL" -c "\COPY public.axe FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/axe.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.ppg FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/ppg.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.ministere FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/ministere.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.datajobs_execution FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/datajobs_execution.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.nouveaute FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/nouveaute.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependances niveau 1
psql -q -d "$DATABASE_URL" -c "\COPY public.perimetre FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/perimetre.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.chantier_identite FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/chantier_identite.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependances niveau 2
psql -q -d "$DATABASE_URL" -c "\COPY public.indicateur_identite FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/indicateur_identite.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.chantier_territoire FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/chantier_territoire.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.objectif FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/objectif.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependances niveau 3
psql -q -d "$DATABASE_URL" -c "\COPY public.chantier_territoire_jalon FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/chantier_territoire_jalon.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.indicateur_territoire FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/indicateur_territoire.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.synthese_des_resultats FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/synthese_des_resultats.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependances niveau 4
psql -q -d "$DATABASE_URL" -c "\COPY public.indicateur_territoire_jalon FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/indicateur_territoire_jalon.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.indicateur_territoire_valeur_evenement FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/indicateur_territoire_valeur_evenement.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY public.indicateur_territoire_valeur_evenement_taux_avancement FROM '$SCRIPT_DIR/$PUBLIC_SEED_DIR/indicateur_territoire_valeur_evenement_taux_avancement.csv' WITH (FORMAT csv, HEADER true)"
