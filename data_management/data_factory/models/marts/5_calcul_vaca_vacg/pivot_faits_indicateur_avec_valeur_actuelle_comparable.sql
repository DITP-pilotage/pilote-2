WITH vac_from_previous_month as (
SELECT pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    CASE when partitionne_vaca_par like 'from_previous_month' and vaca_operation = 'avg' then
            CASE
               WHEN partitionne_vaca_nombre_de_mois = 3 THEN AVG(pivot.valeur_actuelle_decumulee) over w3
               WHEN partitionne_vaca_nombre_de_mois = 6 THEN AVG(pivot.valeur_actuelle_decumulee) over w6
               WHEN partitionne_vaca_nombre_de_mois = 12 THEN AVG(pivot.valeur_actuelle_decumulee) over w12
               WHEN partitionne_vaca_nombre_de_mois = 48 THEN AVG(pivot.valeur_actuelle_decumulee) over w48
             ELSE null
            END
        END as vaca_moyenne,
    CASE when partitionne_vaca_par like 'from_previous_month' and vaca_operation = 'sum' then
        CASE
           WHEN partitionne_vaca_nombre_de_mois = 3 THEN SUM(pivot.valeur_actuelle_decumulee) over w3
           WHEN partitionne_vaca_nombre_de_mois = 6 THEN SUM(pivot.valeur_actuelle_decumulee) over w6
           WHEN partitionne_vaca_nombre_de_mois = 12 THEN SUM(pivot.valeur_actuelle_decumulee) over w12
           WHEN partitionne_vaca_nombre_de_mois = 48 THEN SUM(pivot.valeur_actuelle_decumulee) over w48
        ELSE null
        END
    END as vaca_somme,
    CASE when partitionne_vacg_par like 'from_previous_month' and vacg_operation = 'avg' then
        CASE
           WHEN partitionne_vacg_nombre_de_mois = 3 THEN AVG(pivot.valeur_actuelle_decumulee) over w3
           WHEN partitionne_vacg_nombre_de_mois = 6 THEN AVG(pivot.valeur_actuelle_decumulee) over w6
           WHEN partitionne_vacg_nombre_de_mois = 12 THEN AVG(pivot.valeur_actuelle_decumulee) over w12
           WHEN partitionne_vacg_nombre_de_mois = 48 THEN AVG(pivot.valeur_actuelle_decumulee) over w48
         ELSE null
        END
    END as vacg_moyenne,
    CASE when partitionne_vacg_par like 'from_previous_month' and vacg_operation = 'sum' then
        CASE
           WHEN partitionne_vacg_nombre_de_mois = 3 THEN SUM(pivot.valeur_actuelle_decumulee) over w3
           WHEN partitionne_vacg_nombre_de_mois = 6 THEN SUM(pivot.valeur_actuelle_decumulee) over w6
           WHEN partitionne_vacg_nombre_de_mois = 12 THEN SUM(pivot.valeur_actuelle_decumulee) over w12
           WHEN partitionne_vacg_nombre_de_mois = 48 THEN SUM(pivot.valeur_actuelle_decumulee) over w48
        ELSE null
        END
    END as vacg_somme
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
        WHEN parametrage.partitionne_vaca_par = 'from_year_start' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vaca_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    WHEN parametrage.vaca_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND date_trunc('year', pivot_pour_cumuler_valeur_actuelle.date_releve) = date_trunc('year', pivot.date_releve)
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
            )
        WHEN parametrage.partitionne_vaca_par = 'from_custom_date' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vaca_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    WHEN parametrage.vaca_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve >= parametrage.partitionne_vaca_depuis
            )
        WHEN parametrage.partitionne_vaca_par = 'from_previous_month' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vaca_operation = 'avg' THEN vac_from_previous_month.vaca_moyenne
                    WHEN parametrage.vaca_operation = 'sum' THEN vac_from_previous_month.vaca_somme
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM vac_from_previous_month
                WHERE vac_from_previous_month.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month.zone_id = pivot.zone_id
                    AND vac_from_previous_month.date_releve = pivot.date_releve
                    AND vac_from_previous_month.vaca_moyenne IS NOT NULL
            )
            WHEN parametrage.partitionne_vaca_par = 'from_month' THEN
            (
                CASE
                    WHEN EXTRACT(MONTH FROM date_trunc('month', pivot.date_releve)) > parametrage.partitionne_vaca_nombre_de_mois THEN
                    (
                        SELECT
                            CASE
                                WHEN parametrage.vaca_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                WHEN parametrage.vaca_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                ELSE pivot.valeur_actuelle_decumulee
                            END as vac
                        FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                        WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                            AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                            AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                        AND pivot_pour_cumuler_valeur_actuelle.date_releve >= make_date(CAST(EXTRACT(YEAR FROM date_trunc('year', pivot.date_releve)) AS INTEGER), parametrage.partitionne_vaca_nombre_de_mois, 1)
                    )
                    WHEN EXTRACT(MONTH FROM date_trunc('month', pivot.date_releve)) < parametrage.partitionne_vaca_nombre_de_mois THEN
                    (
                        SELECT
                            CASE
                                WHEN parametrage.vaca_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                WHEN parametrage.vaca_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                ELSE pivot.valeur_actuelle_decumulee
                            END as vac
                        FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                        WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                            AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                            AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve >= make_date(CAST(EXTRACT(YEAR FROM date_trunc('year', pivot.date_releve)) - 1 AS INTEGER), parametrage.partitionne_vaca_nombre_de_mois, 1)
                    )
                    ELSE pivot.valeur_actuelle_decumulee
                END
            )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement annuel (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_annuelle,
    CASE
        WHEN pivot.valeur_actuelle_decumulee IS NULL THEN NULL -- sinon on a un calcul de vacg alors que la valeur est nulle
        WHEN parametrage.partitionne_vacg_par = 'from_year_start' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vacg_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    WHEN parametrage.vacg_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND date_trunc('year', pivot_pour_cumuler_valeur_actuelle.date_releve) = date_trunc('year', pivot.date_releve)
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
            )
        WHEN parametrage.partitionne_vacg_par = 'from_custom_date' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vacg_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    WHEN parametrage.vacg_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                    AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                    AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                    AND pivot_pour_cumuler_valeur_actuelle.date_releve >= parametrage.partitionne_vacg_depuis
            )
        WHEN parametrage.partitionne_vacg_par = 'from_previous_month' THEN
            (
                SELECT
                CASE
                    WHEN parametrage.vacg_operation = 'avg' THEN vac_from_previous_month.vacg_moyenne
                    WHEN parametrage.vacg_operation = 'sum' THEN vac_from_previous_month.vacg_somme
                    ELSE pivot.valeur_actuelle_decumulee
                END as vac
                FROM vac_from_previous_month
                WHERE vac_from_previous_month.indicateur_id = pivot.indicateur_id
                    AND vac_from_previous_month.zone_id = pivot.zone_id
                    AND vac_from_previous_month.date_releve = pivot.date_releve
                    AND vac_from_previous_month.vacg_moyenne IS NOT NULL
            )
        WHEN parametrage.partitionne_vacg_par = 'from_month' THEN
            (
                CASE
                    WHEN EXTRACT(MONTH FROM date_trunc('month', pivot.date_releve)) > parametrage.partitionne_vacg_nombre_de_mois THEN
                    (
                        SELECT
                            CASE
                                WHEN parametrage.vacg_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                WHEN parametrage.vacg_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                ELSE pivot.valeur_actuelle_decumulee
                            END as vac
                        FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                        WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                            AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                            AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                        AND pivot_pour_cumuler_valeur_actuelle.date_releve >= make_date(CAST(EXTRACT(YEAR FROM date_trunc('year', pivot.date_releve)) AS INTEGER), parametrage.partitionne_vacg_nombre_de_mois, 1)
                    )
                    WHEN EXTRACT(MONTH FROM date_trunc('month', pivot.date_releve)) < parametrage.partitionne_vacg_nombre_de_mois THEN
                    (
                        SELECT
                            CASE
                                WHEN parametrage.vacg_operation = 'sum' THEN SUM(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                WHEN parametrage.vacg_operation = 'avg' THEN AVG(pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee)
                                ELSE pivot.valeur_actuelle_decumulee
                            END as vac
                        FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot_pour_cumuler_valeur_actuelle
                        WHERE pivot_pour_cumuler_valeur_actuelle.indicateur_id = pivot.indicateur_id
                            AND pivot_pour_cumuler_valeur_actuelle.zone_id = pivot.zone_id
                            AND pivot_pour_cumuler_valeur_actuelle.valeur_actuelle_decumulee IS NOT NULL
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve <= pivot.date_releve
                            AND pivot_pour_cumuler_valeur_actuelle.date_releve >= make_date(CAST(EXTRACT(YEAR FROM date_trunc('year', pivot.date_releve)) - 1 AS INTEGER), parametrage.partitionne_vacg_nombre_de_mois, 1)
                    )
                    ELSE pivot.valeur_actuelle_decumulee
                END
            )
        ELSE valeur_actuelle_decumulee -- todo: mettre à nulle cette valeur afin de ne pas calculer de taux d'avancement global (et donc utiliser celui de dfakto pour le moment)
    END AS valeur_actuelle_comparable_globale,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_decumulee')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
