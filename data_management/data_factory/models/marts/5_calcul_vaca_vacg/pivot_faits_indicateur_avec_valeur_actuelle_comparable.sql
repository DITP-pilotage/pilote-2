SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    pivot.valeur_initiale,
    pivot.valeur_actuelle,
    pivot.valeur_actuelle_decumulee,
    CASE
        WHEN parametrage.partitionne_vaca_par = 'from_year_start' AND parametrage.vaca_operation = 'sum' THEN
            (
                SELECT SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND date_trunc('year', pivot_pour_cumuler_valeur_actuelle.date_releve) = date_trunc('year', pivot.date_releve)
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
            )
        ELSE valeur_actuelle_decumulee
    END AS valeur_actuelle_comparable_annuelle,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
