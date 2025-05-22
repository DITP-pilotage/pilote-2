DUMP_DEST=scripts/dumps/dump_prod_partielle.dump

source .env

# [import]
echo ">> TRUNCATE content of these tables..."
time psql -d $DATABASE_URL -c "
TRUNCATE TABLE
    public.indicateur_territoire_jalon,
    public.indicateur_territoire,
    public.indicateur_identite,
    public.chantier_territoire_jalon,
    public.chantier_territoire,
    public.chantier_identite,
    public.decision_strategique,
    public.rapport_import_mesure_indicateur,
    public.commentaire,
    public.habilitation,
    public.historisation_modification,
    public.synthese_des_resultats,
    raw_data.mesure_indicateur,
    raw_data.commentaires,
    raw_data.metadata_indicateurs_complementaire,
    raw_data.metadata_indicateurs_hidden,
    raw_data.metadata_parametrage_indicateurs,
    public.mesure_indicateur_temporaire,
    public.objectif,
    public.utilisateur,
    public.erreur_validation_fichier,
    public.proposition_valeur_actuelle;"

echo ">> pg_restore dumped file..."
time pg_restore -d $DATABASE_URL --verbose \
    --no-owner --no-privileges --exit-on-error \
    $DUMP_DEST
