DUMP_DEST=scripts/dumps/dump_prod_partielle.dump

source .env

# [export]
## [export.dump] pg_dump data of specific tables
echo ">> Dumping data..."
time pg_dump -d $CONN_STR_PROD --verbose \
    --no-owner --data-only --format custom --compress 9 \
    --table public.chantier_identite \
    --table public.chantier_territoire \
    --table public.rapport_import_mesure_indicateur \
    --table public.commentaire \
    --table public.decision_strategique \
    --table public.habilitation \
    --table public.historisation_modification \
    --table public.synthese_des_resultats \
    --table public.utilisateur \
    --table raw_data.mesure_indicateur \
    --table raw_data.commentaires \
    --table raw_data.metadata_indicateurs_complementaire \
    --table raw_data.metadata_indicateurs_hidden \
    --table raw_data.metadata_parametrage_indicateurs \
    --table public.mesure_indicateur_temporaire \
    --table public.erreur_validation_fichier \
    --table public.objectif \
    --table public.proposition_valeur_actuelle \
    --file=$DUMP_DEST
