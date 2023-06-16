vac_from_previous_month as (
SELECT pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    CASE when partitionne_vacg_par like 'from_previous_month' and vacg_operation = 'avg' then
        CASE
           WHEN partitionne_vacg_nombre_de_mois = '3' THEN AVG(pivot.valeur_actuelle_decumulee) over w3
           WHEN partitionne_vacg_nombre_de_mois = '6' THEN AVG(pivot.valeur_actuelle_decumulee) over w6
           WHEN partitionne_vacg_nombre_de_mois = '12' THEN AVG(pivot.valeur_actuelle_decumulee) over w12
           WHEN partitionne_vacg_nombre_de_mois = '48' THEN AVG(pivot.valeur_actuelle_decumulee) over w48
         ELSE null
        END
    END as moyenne,
    CASE when partitionne_vacg_par like 'from_previous_month' and vacg_operation = 'sum' then
        CASE
           WHEN partitionne_vacg_nombre_de_mois = '3' THEN SUM(pivot.valeur_actuelle_decumulee) over w3
           WHEN partitionne_vacg_nombre_de_mois = '6' THEN SUM(pivot.valeur_actuelle_decumulee) over w6
           WHEN partitionne_vacg_nombre_de_mois = '12' THEN SUM(pivot.valeur_actuelle_decumulee) over w12
           WHEN partitionne_vacg_nombre_de_mois = '48' THEN SUM(pivot.valeur_actuelle_decumulee) over w48
        ELSE null
        END
    END as somme
    FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
    WINDOW
        w3 as (PARTITION BY pivot.indicateur_id, pivot.zone_id  ORDER BY date_trunc('month', pivot.date_releve) RANGE BETWEEN INTERVAL '2 months' PRECEDING AND CURRENT ROW),
        w6 as (PARTITION BY pivot.indicateur_id, pivot.zone_id  ORDER BY date_trunc('month', pivot.date_releve) RANGE BETWEEN INTERVAL '5 months' PRECEDING AND CURRENT ROW),
        w12 as (PARTITION BY pivot.indicateur_id, pivot.zone_id  ORDER BY date_trunc('month', pivot.date_releve) RANGE BETWEEN INTERVAL '11 months' PRECEDING AND CURRENT ROW),
        w48 as (PARTITION BY pivot.indicateur_id, pivot.zone_id  ORDER BY date_trunc('month', pivot.date_releve) RANGE BETWEEN INTERVAL '47 months' PRECEDING AND CURRENT ROW)
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
        WHEN parametrage.partitionne_vaca_par = 'from_previous_month' and parametrage.vaca_operation = 'avg'THEN
            (
                SELECT vac_from_previous_month.moyenne
                FROM vac_from_previous_month
                WHERE vac_from_previous_month.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month.zone_id = pivot.zone_id
                    AND vac_from_previous_month.date_releve = pivot.date_releve
                    AND vac_from_previous_month.moyenne IS NOT NULL
            )
        WHEN parametrage.partitionne_vaca_par = 'from_previous_month' and parametrage.vac_operation = 'sum' THEN
            (
                SELECT vac_from_previous_month_3.somme
                FROM vac_from_previous_month_3
                WHERE vac_from_previous_month_3.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_3.zone_id = pivot.zone_id
                    AND vac_from_previous_month_3.date_releve = pivot.date_releve
                    AND vac_from_previous_month_3.somme IS NOT NULL
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
            )-- todo la suite
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' AND parametrage.partitionne_vacg_nombre_de_mois = 3 AND parametrage.vacg_operation = 'avg' THEN
            (
                SELECT vac_from_previous_month_3.moyenne
                FROM vac_from_previous_month_3
                WHERE vac_from_previous_month_3.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_3.zone_id = pivot.zone_id
                    AND vac_from_previous_month_3.date_releve = pivot.date_releve
                    AND vac_from_previous_month_3.moyenne IS NOT NULL
            )
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' AND parametrage.partitionne_vacg_nombre_de_mois = 3 AND parametrage.vacg_operation = 'sum' THEN
            (
                SELECT vac_from_previous_month_3.somme
                FROM vac_from_previous_month_3
                WHERE vac_from_previous_month_3.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_3.zone_id = pivot.zone_id
                    AND vac_from_previous_month_3.date_releve = pivot.date_releve
                    AND vac_from_previous_month_3.somme IS NOT NULL
            )
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' AND parametrage.partitionne_vacg_nombre_de_mois = 6 AND parametrage.vacg_operation = 'avg' THEN
            (
                SELECT vac_from_previous_month_6.moyenne
                FROM vac_from_previous_month_6
                WHERE vac_from_previous_month_6.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_6.zone_id = pivot.zone_id
                    AND vac_from_previous_month_6.date_releve = pivot.date_releve
                    AND vac_from_previous_month_6.moyenne IS NOT NULL
            )
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' AND parametrage.partitionne_vacg_nombre_de_mois = 6 AND parametrage.vacg_operation = 'sum' THEN
            (
                SELECT vac_from_previous_month_6.somme
                FROM vac_from_previous_month_6
                WHERE vac_from_previous_month_6.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month_6.zone_id = pivot.zone_id
                    AND vac_from_previous_month_6.date_releve = pivot.date_releve
                    AND vac_from_previous_month_6.somme IS NOT NULL
            )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement global (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_globale,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
