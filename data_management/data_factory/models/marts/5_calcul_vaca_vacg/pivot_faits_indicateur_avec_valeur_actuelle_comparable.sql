WITH vac_from_previous_month_3 as (
SELECT indicateur_id,
zone_id,
date_releve,
AVG(valeur_actuelle_decumulee)
    OVER (
        PARTITION BY indicateur_id, zone_id
        ORDER BY date_trunc('month', date_releve)
        RANGE BETWEEN INTERVAL '2 months' PRECEDING AND CURRENT ROW
    )
    FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}}
),

vac_from_previous_month_6 as (
SELECT indicateur_id,
zone_id,
date_releve,
AVG(valeur_actuelle_decumulee)
    OVER (
        PARTITION BY indicateur_id, zone_id
        ORDER BY date_trunc('month', date_releve)
        RANGE BETWEEN INTERVAL '5 months' PRECEDING AND CURRENT ROW
    )
    FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}}
)

SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    pivot.valeur_initiale,
    pivot.valeur_actuelle,
    pivot.valeur_actuelle_decumulee,
    CASE
        WHEN pivot.valeur_actuelle_decumulee IS NULL THEN NULL -- sinon on a un calcul de vaca alors que la valeur est nulle
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
        WHEN parametrage.partitionne_vaca_par = 'from_year_start' AND parametrage.vaca_operation = 'avg' THEN
            (
                SELECT AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND date_trunc('year', pivot_pour_cumuler_valeur_actuelle.date_releve) = date_trunc('year', pivot.date_releve)
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
            )
        WHEN parametrage.partitionne_vaca_par = 'from_previous_month' AND parametrage.partitionne_vaca_depuis = '1000-01-03' AND parametrage.vaca_operation = 'avg' THEN
        (
            SELECT vac_from_previous_month_3.avg
            FROM vac_from_previous_month_3
            WHERE vac_from_previous_month_3.indicateur_id = pivot.indicateur_id
                AND vac_from_previous_month_3.zone_id = pivot.zone_id
                AND vac_from_previous_month_3.date_releve = pivot.date_releve
                AND vac_from_previous_month_3.avg IS NOT NULL
        )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement annuel (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_annuelle,
    CASE
        WHEN pivot.valeur_actuelle_decumulee IS NULL THEN NULL -- sinon on a un calcul de vacg alors que la valeur est nulle
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
        WHEN parametrage.partitionne_vacg_par = 'from_custom_date' AND parametrage.vacg_operation = 'avg' THEN
            (
                SELECT AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve >= parametrage.partitionne_vacg_depuis
            )
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' AND parametrage.partitionne_vacg_depuis = '1000-01-06' AND parametrage.vacg_operation = 'avg' THEN
            (
                SELECT vac_from_previous_month_6.avg
                FROM vac_from_previous_month_6
                WHERE vac_from_previous_month_6.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_6.zone_id = pivot.zone_id
                    AND vac_from_previous_month_6.date_releve = pivot.date_releve
                    AND vac_from_previous_month_6.avg IS NOT NULL
            )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement global (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_globale,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
