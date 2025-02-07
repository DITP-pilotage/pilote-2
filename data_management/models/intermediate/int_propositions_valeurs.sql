WITH ranked_propositions AS (
    SELECT
        pva.indic_id,
        pva.territoire_code,
        t.zone_id,
        pva.date_valeur_actuelle,
        pva.date_proposition,
        pva.valeur_actuelle_proposee,
        pva.motif_proposition,
        pva.source_donnee_methode_calcul,
        INITCAP(utilisateur.prenom) || ' ' || INITCAP(utilisateur.nom) AS auteur_proposition,
        ROW_NUMBER() OVER (PARTITION BY pva.indic_id, pva.territoire_code, pva.date_valeur_actuelle ORDER BY pva.date_proposition DESC) AS rang
    FROM {{ source('db_schema_public', 'proposition_valeur_actuelle') }} pva
    LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} utilisateur ON pva.id_auteur_modification = utilisateur.id
    LEFT JOIN {{ source('db_schema_public', 'territoire') }} t ON t.code =pva.territoire_code
    WHERE statut = 'EN_COURS'
)
SELECT
    indic_id,
    territoire_code,
    zone_id,
    date_valeur_actuelle,
    date_proposition,
    valeur_actuelle_proposee,
    motif_proposition,
    source_donnee_methode_calcul,
    auteur_proposition
FROM ranked_propositions
WHERE rang = 1
