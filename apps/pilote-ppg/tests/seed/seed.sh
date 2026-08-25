#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW_DATA_SEED_DIR="raw_data"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load E2E environment variables
set -a
source "$PROJECT_ROOT/${ENV_FILE:-.env.e2e}"
set +a

pnpm exec prisma migrate reset --force

psql -q -d "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql"

psql -q -d "$DATABASE_URL" -f "$SCRIPT_DIR/utilisateurs-test.sql"
psql -q -d "$DATABASE_URL" -f "$SCRIPT_DIR/seed-metadata-indicateur.sql"

# Tables sans dependances
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_axes (axe_id, axe_name, axe_desc) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_axes.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_ppgs (ppg_id, ppg_nom, ppg_desc, ppg_axe) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_ppgs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantier_meteos FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_chantier_meteos.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_engagement (engagement_id, engagement_short, engagement_name) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_engagement.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_perimetres (perimetre_id, per_nom, per_porteur_id) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_perimetres.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_porteurs (porteur_id, porteur_short, porteur_name, porteur_desc, porteur_type, porteur_directeur, porteur_name_short, porteur_picto) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_porteurs.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zonegroup (zone_group_id, zg_name, zg_desc, zg_zones) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_zonegroup.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zones (zone_id, nom, zone_code, zone_type, zone_parent) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_zones.csv' WITH (FORMAT csv, HEADER true)"
psql -q -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantiers (chantier_id, ch_nom, ch_descr, ch_ppg, ch_territo, engagement_short, ch_hidden_pilote, ch_saisie_ate, ch_state, zg_applicable, \"porteur_id_principal\", \"porteur_ids_secondaires\", \"porteur_ids_DAC\", ch_per, maille_applicable, replicate_val_reg_to, replicate_val_nat_to, ch_cible_attendue, conseiller_mail) FROM '$SCRIPT_DIR/$RAW_DATA_SEED_DIR/metadata_chantiers.csv' WITH (FORMAT csv, HEADER true)"

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
