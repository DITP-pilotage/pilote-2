DUMP_DEST=out/dump_prod_partielle.dump

export $(cat .env | xargs)

# [import]
echo ">> TRUNCATE content of these tables..."
time psql -d $CONN_STR_DESTINATION -c "
TRUNCATE TABLE 
    public.rapport_import_mesure_indicateur, 
    public.commentaire, 
    public.habilitation, 
    public.historisation_modification, 
    public.synthese_des_resultats, 
    public.utilisateur, 
    raw_data.mesure_indicateur, 
    raw_data.commentaires, 
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
time pg_restore -d $CONN_STR_DESTINATION --verbose \
    --no-owner --no-privileges --exit-on-error \
    $DUMP_DEST
