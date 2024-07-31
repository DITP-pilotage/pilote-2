WITH ranked_propositions AS (
    SELECT
        pva.indic_id,
        pva.territoire_code,
        pva.date_valeur_actuelle,
        pva.date_proposition,
        pva.motif_proposition,
        pva.source_donnee_methode_calcul,
        INITCAP(CONCAT(u.prenom, ' ', u.nom)) AS auteur_proposition,
        ROW_NUMBER() OVER (PARTITION BY pva.indic_id, pva.territoire_code, pva.date_valeur_actuelle ORDER BY pva.date_proposition DESC) AS rang
    FROM {{ source('db_schema_public', 'proposition_valeur_actuelle') }} pva
    LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON pva.id_auteur_modification = u.id::text
    WHERE statut = 'EN_COURS'
)
SELECT
    indic_id,
    territoire_code,
    date_valeur_actuelle,
    date_proposition,
    motif_proposition,
    source_donnee_methode_calcul,
    auteur_proposition
FROM ranked_propositions
WHERE rang = 1