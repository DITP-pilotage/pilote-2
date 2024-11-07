WITH ranked_propositions AS (
    SELECT
        pva.indic_id,
        pva.territoire_code,
        pva.date_valeur_actuelle,
        pva.date_proposition,
        pva.valeur_actuelle_proposee,
        pva.motif_proposition,
        pva.source_donnee_methode_calcul,
        pva.auteur_modification AS auteur_proposition,
        ROW_NUMBER() OVER (PARTITION BY pva.indic_id, pva.territoire_code, pva.date_valeur_actuelle ORDER BY pva.date_proposition DESC) AS rang
    FROM {{ source('db_schema_public', 'proposition_valeur_actuelle') }} pva
    WHERE statut = 'EN_COURS'
)
SELECT
    indic_id,
    territoire_code,
    date_valeur_actuelle,
    date_proposition,
    valeur_actuelle_proposee,
    motif_proposition,
    source_donnee_methode_calcul,
    auteur_proposition
FROM ranked_propositions
WHERE rang = 1