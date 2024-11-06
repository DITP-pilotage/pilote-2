DUMP_DEST=scripts/dumps/dump_prod_partielle.dump

# [import]
echo ">> TRUNCATE content of these tables..."
time psql -d $DATABASE_URL -c "
TRUNCATE TABLE
    public.rapport_import_mesure_indicateur,
    public.commentaire,
    public.scope,
    public.profil,
    public.habilitation,
    public.historisation_modification,
    public.synthese_des_resultats,
    public.utilisateur,
    raw_data.mesure_indicateur,
    raw_data.commentaires,
    raw_data.metadata_indicateurs_complementaire,
    raw_data.metadata_indicateurs_hidden,
    raw_data.metadata_parametrage_indicateurs,
    public.mesure_indicateur_temporaire,
    public.objectif,
    public.commentaire_projet_structurant,
    public.indicateur_projet_structurant,
    public.objectif_projet_structurant,
    public.perimetre_projet_structurant,
    public.projet_structurant,
    public.synthese_des_resultats_projet_structurant,
    public.erreur_validation_fichier;"

echo ">> pg_restore dumped file..."
time pg_restore -d $DATABASE_URL --verbose \
    --no-owner --no-privileges --exit-on-error \
    $DUMP_DEST
