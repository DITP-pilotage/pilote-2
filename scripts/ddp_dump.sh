DUMP_DEST=scripts/dumps/dump_prod_partielle.dump

source .env

# [export]
## [export.dump] pg_dump data of specific tables
echo ">> Dumping data..."
time pg_dump -d $CONN_STR_PROD --verbose \
    --no-owner --data-only --format custom --compress 9 \
    --table public.chantier_identite \
    --table public.chantier_territoire \
    --table public.indicateur_identite \
    --table public.indicateur_territoire \
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
    --table public.indicateur_territoire_valeur_evenement \
    --table public.referentiel_objectif \
    --table public.referentiel_tutelle \
    --table public.referentiel_critere \
    --table public.referentiel_sous_critere \
    --table public.referentiel_rattachement \
    --table public.fiche_evaluation \
    --table public.etape_evaluation \
    --table public.rattachement_utilisateur_etape_jalon \
    --table public.evaluation_objectif \
    --table public.evaluation_critere \
    --table public.instruction_objectif \
    --table public.instruction_critere \
    --file=$DUMP_DEST
