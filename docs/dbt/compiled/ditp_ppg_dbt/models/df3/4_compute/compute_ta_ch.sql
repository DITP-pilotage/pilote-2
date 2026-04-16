


WITH
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic AS (
    SELECT
        indicateurs.chantier_id,
        computed_values.zone_id,
        zones.maille,
        computed_values.metric_date,
        computed_values.indic_id,
        computed_values.vaca,
        computed_values.vig,
        computed_values.vca_courant,
        computed_values.vca_adate,
        computed_values.vca_adate_date,
        computed_values.vcg,
        computed_values.taa_courant,
        computed_values.taa_adate,
        computed_values.tag
    FROM "dev_pilote__6230"."df3"."compute_ta_indic" AS computed_values
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS indicateurs
        ON computed_values.indic_id = indicateurs.id
    LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
        ON computed_values.zone_id = zones.id
),

-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond AS (
    SELECT
        ta_zone_indic.*,
        ponderation.poids_zone_reel,
        ta_zone_indic.taa_courant
        * 0.01
        * ponderation.poids_zone_reel AS taa_courant_pond,
        ta_zone_indic.taa_adate
        * 0.01
        * ponderation.poids_zone_reel AS taa_adate_pond,
        ta_zone_indic.tag * 0.01 * ponderation.poids_zone_reel AS tag_pond
    FROM ta_zone_indic
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_ponderation_reelle" AS ponderation
        ON
            ta_zone_indic.indic_id = ponderation.indic_id
            AND ta_zone_indic.zone_id = ponderation.zone_id
),

-- Pour chaque indic-zone,
-- on garde la ligne avec une vaca la plus récente
-- avec date<=max_date_taa_courant_today
ta_zone_indic_pond_today_ordered AS (
    SELECT
        ta_zone_indic_pond.*,
        RANK()
            OVER (
                PARTITION BY
                    ta_zone_indic_pond.zone_id, ta_zone_indic_pond.indic_id
                ORDER BY ta_zone_indic_pond.metric_date DESC
            )
            AS rang,
        max_date_vaca_ch.max_date_taa_courant_today AS max_date,
        'today' AS valid_on
    FROM ta_zone_indic_pond
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_max_date_vaca_ch" AS max_date_vaca_ch
        ON
            ta_zone_indic_pond.chantier_id = max_date_vaca_ch.chantier_id
            AND ta_zone_indic_pond.zone_id = max_date_vaca_ch.zone_id
    WHERE
        ta_zone_indic_pond.vaca IS NOT NULL
        AND ta_zone_indic_pond.metric_date
        <= max_date_vaca_ch.max_date_taa_courant_today
),

ta_zone_indic_pond_today AS (
    SELECT *
    FROM ta_zone_indic_pond_today_ordered
    WHERE rang = 1
),

-- Pour chaque indic-zone,
-- on garde la ligne avec une vaca la plus récente
-- avec date<=max_date_taa_courant_previous
ta_zone_indic_pond_prev_month_ordered AS (
    SELECT
        ta_zone_indic_pond.*,
        RANK()
            OVER (
                PARTITION BY
                    ta_zone_indic_pond.zone_id,
                    ta_zone_indic_pond.indic_id
                ORDER BY ta_zone_indic_pond.metric_date DESC
            )
            AS rang,
        max_date_vaca_ch.max_date_taa_courant_previous AS max_date,
        'prev_month' AS valid_on
    FROM ta_zone_indic_pond
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_max_date_vaca_ch" AS max_date_vaca_ch
        ON
            ta_zone_indic_pond.chantier_id = max_date_vaca_ch.chantier_id
            AND ta_zone_indic_pond.zone_id = max_date_vaca_ch.zone_id
    WHERE
        ta_zone_indic_pond.vaca IS NOT NULL
        AND ta_zone_indic_pond.metric_date
        <= max_date_vaca_ch.max_date_taa_courant_previous
),

ta_zone_indic_pond_prev_month AS (
    SELECT * FROM ta_zone_indic_pond_prev_month_ordered
    WHERE rang = 1
),

-- Calcul du TA chantier intermediaire 
-- car sans prendre en compte le nb de TA indic remontés pour ce CH (PIL-227)
ta_ch_int AS (
    SELECT
        a.chantier_id,
        a.zone_id,
        a.valid_on,
        -- Nombre de TA indicateurs remontés pour ce {chantier-zone}
        COUNT(a.indic_id) AS n_indic_in_ta,
        ARRAY_AGG(a.indic_id) AS indic_ids,
        ARRAY_AGG(a.poids_zone_reel) AS p_zone_reel,
        ARRAY_AGG(a.vaca) AS vaca_agg,
        ARRAY_AGG(a.vig) AS vig_agg,
        ARRAY_AGG(a.vca_courant) AS vca_courant_agg,
        ARRAY_AGG(a.vca_adate) AS vca_adate_agg,
        ARRAY_AGG(a.vca_adate_date) AS vca_adate_date_agg,
        ARRAY_AGG(a.vcg) AS vcg_agg,
        ARRAY_AGG(a.taa_courant) AS taa_courant_agg,
        ARRAY_AGG(a.taa_adate) AS taa_adate_agg,
        ARRAY_AGG(a.taa_courant_pond) AS taa_courant_pond_agg,
        ARRAY_AGG(a.taa_adate_pond) AS taa_adate_pond_agg,
        ARRAY_AGG(a.tag) AS tag_agg,
        ARRAY_AGG(a.tag_pond) AS tag_pond_agg,
        -- Calcul du TA par somme des TA pondérés et bornage dans [0,100]
        CASE
            WHEN BOOL_OR(a.taa_courant_pond IS NULL) THEN NULL
            ELSE ROUND(
                LEAST(
                    GREATEST(
                        SUM(a.taa_courant_pond)::NUMERIC,
                        0
                    ),
                    100
                ),
                3
            )
        END AS taa_courant_ch_int,
        -- [adate] Calcul TA par somme des TA pondérés et bornage dans [0,100]
        CASE
            WHEN BOOL_OR(a.taa_adate_pond IS NULL) THEN NULL
            ELSE ROUND(
                LEAST(
                    GREATEST(
                        SUM(a.taa_adate_pond)::NUMERIC,
                        0
                    ),
                    100
                ),
                3
            )
        END AS taa_adate_ch_int,
        CASE
            WHEN BOOL_OR(a.tag_pond IS NULL) THEN NULL
            ELSE ROUND(
                LEAST(
                    GREATEST(
                        SUM(a.tag_pond)::NUMERIC,
                        0
                    ),
                    100
                ),
                3
            )
        END AS tag_ch_int,
        -- (PIL-253) Date du TA= date la plus tardive des VA indic du chantier
        MAX(a.metric_date) AS date_ta_int
    FROM
        (
            -- On ne considère que les TA dont les indicateurs
            -- ont une pondération réelle > 0
            -- pour le calcul du TA chantier
            -- (ie la somme des TA indicateurs pondérés)
            SELECT * FROM ta_zone_indic_pond_today
            WHERE poids_zone_reel > 0
            UNION
            SELECT *
            FROM ta_zone_indic_pond_prev_month
            WHERE poids_zone_reel > 0
        ) AS a
    GROUP BY a.chantier_id, a.zone_id, a.valid_on
),

-- Ajout du code territoire_code
ta_ch_int_terr_code AS (
    SELECT
        ta_ch_int.*,
        territoire.code AS territoire_code
    FROM ta_ch_int
    LEFT JOIN
        "dev_pilote__6230"."public"."territoire" AS territoire
        ON ta_ch_int.zone_id = territoire.zone_id
),

-- Ajout du nombre d'indics attendus pour chaque {chantier-zone}:
-- n_indic_in_ta_expected
ta_ch_terr_code_indic_expected AS (
    SELECT
        ta_ch_int_terr_code.*,
        get_n_indic_in_ta_expected.n_indic_in_ta_expected
    FROM ta_ch_int_terr_code
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_n_indic_in_ta_expected" AS get_n_indic_in_ta_expected
        ON
            ta_ch_int_terr_code.chantier_id
            = get_n_indic_in_ta_expected.chantier_id
            AND ta_ch_int_terr_code.zone_id = get_n_indic_in_ta_expected.zone_id
),

ta_ch_no_date AS (
-- (PIL-227) Ici, on va vérifier pour chaque {zone-chantier}
-- que l'on a bien combiné le nombre de TA indic que l'on attendait.
-- On compare le nb de TA indic combiné,
-- avec le nb d'indics ayant une pondération non vide
    SELECT
        *,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected
                THEN taa_courant_ch_int
        END AS taa_courant_ch,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected
                THEN taa_adate_ch_int
        END AS taa_adate_ch,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected
                THEN tag_ch_int
        END AS tag_ch
    FROM ta_ch_terr_code_indic_expected
),

-- On ajuste la date du TA. 
--	Si aucun TA (ni TAA, ni TAG) => date_ta = NULL, sinon date_ta = date_ta_int
ta_ch AS (
    SELECT
        *,
        CASE
            WHEN taa_courant_ch IS NULL AND tag_ch IS NULL THEN NULL
            ELSE date_ta_int
        END AS date_ta
    FROM ta_ch_no_date
)

SELECT * FROM ta_ch