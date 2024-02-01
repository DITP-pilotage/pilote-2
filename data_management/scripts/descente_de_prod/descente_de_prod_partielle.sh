DUMP_DEST=out/dump_prod_partielle.dump

export $(cat .env | xargs)

# [export]
## [export.dump] pg_dump data of specific tables
echo ">> Dumping data..."
time pg_dump -d $CONN_STR_PROD --verbose \
    --no-owner --data-only --format custom --compress 9 \
    --table public.rapport_import_mesure_indicateur \
    --table public.commentaire \
    --table public.habilitation \
    --table public.historisation_modification \
    --table public.synthese_des_resultats \
    --table public.utilisateur \
    --table raw_data.mesure_indicateur \
    --table raw_data.commentaires \
    --table public.mesure_indicateur_temporaire \
    --table public.erreur_validation_fichier \
    --table public.objectif \
    --table public.commentaire_projet_structurant \
    --table public.indicateur_projet_structurant \
    --table public.objectif_projet_structurant \
    --table public.perimetre_projet_structurant \
    --table public.projet_structurant \
    --table public.synthese_des_resultats_projet_structurant \
    --file=$DUMP_DEST

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
