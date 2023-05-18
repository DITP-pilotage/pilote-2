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
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement annuel (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_annuelle,
    CASE
        WHEN parametrage.partitionne_vacg_par = 'from_custom_date' AND parametrage.vacg_operation = 'sum' THEN
            (
                SELECT SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve >= parametrage.partitionne_vacg_depuis
            )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement global (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_globale,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
