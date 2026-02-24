DUMP_DEST=scripts/dumps/dump_prod_partielle.dump

source .env

# [import]
echo ">> TRUNCATE content of these tables..."
time psql -d $DATABASE_URL -c "
TRUNCATE TABLE
    public.metadata_indicateur,
    public.metadata_indicateur_valeur_acceptee,
    public.referentiel_sous_critere,
    public.referentiel_tutelle,
    public.referentiel_rattachement,
    public.referentiel_objectif,
    public.referentiel_critere,
    public.etape_evaluation,
    public.fiche_evaluation,
    public.evaluation_objectif,
    public.evaluation_critere,
    public.instruction_objectif,
    public.instruction_critere,
    public.indicateur_evaluation,
    public.chantier_evaluation,
    public.rapport_hebdomadaire_coordinateur,
    public.rapport_propositions_avancement,
    public.llm_calls,
    public.rattachement_utilisateur_etape_jalon,
    public.proposition_valeur_actuelle,
    public.indicateur_territoire_valeur_evenement,
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
    public.erreur_validation_fichier;"

echo ">> pg_restore dumped file..."
time pg_restore -d $DATABASE_URL --verbose \
    --no-owner --no-privileges --exit-on-error \
    $DUMP_DEST
