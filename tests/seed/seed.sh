#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load E2E environment variables
set -a
source "$PROJECT_ROOT/.env.e2e"
set +a

echo "=== Etape 1: Chargement du schema SQL ==="
psql -d "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql"

echo "=== Etape 2: Seed des utilisateurs de test ==="
cd "$PROJECT_ROOT"
npx ts-node scripts/seedUtilisateursTest.ts

echo "=== Etape 3: Chargement des CSV ==="

# Tables sans dependances
echo "Chargement metadata_axes..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_axes FROM '$SCRIPT_DIR/metadata_axes.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_chantier_meteos..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantier_meteos FROM '$SCRIPT_DIR/metadata_chantier_meteos.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_chantiers..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_chantiers FROM '$SCRIPT_DIR/metadata_chantiers.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_engagement..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_engagement FROM '$SCRIPT_DIR/metadata_engagement.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_indicateur_types..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateur_types FROM '$SCRIPT_DIR/metadata_indicateur_types.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_perimetres..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_perimetres FROM '$SCRIPT_DIR/metadata_perimetres.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_porteurs..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_porteurs FROM '$SCRIPT_DIR/metadata_porteurs.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_zonegroup..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zonegroup FROM '$SCRIPT_DIR/metadata_zonegroup.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_zones..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_zones FROM '$SCRIPT_DIR/metadata_zones.csv' WITH (FORMAT csv, HEADER true)"

# Tables avec dependance sur indicateurs (ordre important)
echo "Chargement metadata_indicateurs..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs FROM '$SCRIPT_DIR/metadata_indicateurs.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_parametrage_indicateurs..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_parametrage_indicateurs FROM '$SCRIPT_DIR/metadata_parametrage_indicateurs.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_indicateurs_complementaire..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs_complementaire FROM '$SCRIPT_DIR/metadata_indicateurs_complementaire.csv' WITH (FORMAT csv, HEADER true)"

echo "Chargement metadata_indicateurs_hidden..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.metadata_indicateurs_hidden FROM '$SCRIPT_DIR/metadata_indicateurs_hidden.csv' WITH (FORMAT csv, HEADER true)"

# Table finale
echo "Chargement mesure_indicateur..."
psql -d "$DATABASE_URL" -c "\COPY raw_data.mesure_indicateur FROM '$SCRIPT_DIR/mesure_indicateur.csv' WITH (FORMAT csv, HEADER true)"

echo "=== Seed termine avec succes ==="
