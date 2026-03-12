WITH
    valeurs_ordonnees AS (
        SELECT
            valeurs.id,
            valeurs.metric_date,
            valeurs.indic_id,
            valeurs.zone_id,
            RANK() OVER (
                PARTITION BY
                    valeurs.indic_id,
                    valeurs.zone_id
                ORDER BY valeurs.metric_date ASC
            ) AS rang
        FROM "dev_pilote__6230"."df3"."merge_computed_values" AS valeurs
        WHERE valeurs.vaca IS NOT NULL
    ),

    jalons_pour_lesquels_calculer_ta AS (
        SELECT
            valeur.id,
            valeur_suivante.metric_date AS date_prochaine_va,
            EXTRACT(
                YEAR FROM GENERATE_SERIES(
                    DATE_TRUNC('year', valeur.metric_date),
                    DATE_TRUNC(
                        'year',
                        COALESCE(
                            valeur_suivante.metric_date,
                            NOW()
                        )
                    ),
                    INTERVAL '1 year'
                )
            ) AS jalon
        FROM valeurs_ordonnees AS valeur
        LEFT OUTER JOIN valeurs_ordonnees AS valeur_suivante
            ON
                valeur.indic_id = valeur_suivante.indic_id
                AND valeur.zone_id = valeur_suivante.zone_id
                AND valeur_suivante.rang = valeur.rang + 1
    ),

    ta AS (
        SELECT
            valeurs.id,
            valeurs.metric_date,
            valeurs.indic_id,
            valeurs.zone_id,
            valeurs.vaca,
            cibles.vca,
            valeurs.vig,
            jalons_pour_lesquels_calculer_ta.jalon,
            CASE
                WHEN
                    jalons_pour_lesquels_calculer_ta.jalon
                    = EXTRACT(YEAR FROM valeurs.metric_date)
                    THEN valeurs.metric_date
                ELSE (jalons_pour_lesquels_calculer_ta.jalon || '-01-01')::DATE
            END AS date_debut_validite_ta,
            CASE
                -- si la prochaine valeur est nulle, 
                -- le plus tôt entre now et la fin de l'année du jalon
                WHEN jalons_pour_lesquels_calculer_ta.date_prochaine_va IS NULL
                    THEN
                        LEAST(
                            DATE_TRUNC('month', NOW()),
                            (
                                jalons_pour_lesquels_calculer_ta.jalon
                                || '-12-01'
                            )::DATE
                        )::DATE
                -- si l'année de prochaine valeur est l'année du jalon,
                -- alors le mois avant la date de la prochaine valeur
                WHEN
                    EXTRACT(
                        YEAR
                        FROM jalons_pour_lesquels_calculer_ta.date_prochaine_va
                    ) = jalons_pour_lesquels_calculer_ta.jalon
                    THEN
                        (
                            jalons_pour_lesquels_calculer_ta.date_prochaine_va
                            - INTERVAL '1 month'
                        )::DATE
                -- sinon la fin de l'année du jalon
                ELSE (jalons_pour_lesquels_calculer_ta.jalon || '-12-01')::DATE
            END AS date_fin_validite_ta,
            

CASE
    WHEN indicateurs.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN valeurs.vig >= cibles.vca AND valeurs.vaca >= cibles.vca
                    THEN 100
                WHEN valeurs.vig >= cibles.vca AND valeurs.vaca < cibles.vca
                    THEN 0
                ELSE ROUND((100 * (valeurs.vaca - valeurs.vig) / (cibles.vca - valeurs.vig))::NUMERIC, 2) 
            END
    WHEN indicateurs.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN valeurs.vig <= cibles.vca AND valeurs.vaca <= cibles.vca
                    THEN 100
                WHEN valeurs.vig <= cibles.vca AND valeurs.vaca > cibles.vca
                    THEN 0
                ELSE ROUND((100 * (valeurs.vaca - valeurs.vig) / (cibles.vca - valeurs.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS ta
        FROM "dev_pilote__6230"."df3"."merge_computed_values" AS valeurs
        LEFT OUTER JOIN
            "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" -- noqa: LT05
                AS indicateurs
            ON valeurs.indic_id = indicateurs.indic_id
        LEFT OUTER JOIN jalons_pour_lesquels_calculer_ta
            ON valeurs.id = jalons_pour_lesquels_calculer_ta.id
        LEFT OUTER JOIN "dev_pilote__6230"."df3"."get_vca_jalon" AS cibles
            ON
                jalons_pour_lesquels_calculer_ta.jalon = cibles.jalon
                AND valeurs.zone_id = cibles.zone_id
                AND valeurs.indic_id = cibles.indic_id
        WHERE valeurs.vaca IS NOT NULL
    ),

    ta_encadre AS (
        SELECT
            ta.*,
            CASE
                WHEN ta.ta IS NULL
                    THEN NULL
                ELSE GREATEST(LEAST(ta.ta, 100), 0)::NUMERIC
            END AS ta_encadre
        FROM ta
    ),

    mois_historique AS (
        SELECT
            GENERATE_SERIES(
                '2022-01-01 00:00'::DATE,
                DATE_TRUNC('month', NOW()), '1 month'
            )::DATE AS snapshot_month
    )

SELECT
    ta_encadre.*,
    mois_historique.snapshot_month
FROM ta_encadre
LEFT OUTER JOIN mois_historique
    ON
        ta_encadre.date_debut_validite_ta <= mois_historique.snapshot_month
        AND ta_encadre.date_fin_validite_ta >= mois_historique.snapshot_month