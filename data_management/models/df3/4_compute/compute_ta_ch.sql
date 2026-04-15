{{ config(materialized='table') }}


WITH
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic AS (
    SELECT
        b.chantier_id,
        a.zone_id,
        z.maille,
        metric_date,
        a.indic_id,
        vaca,
        vig,
        vca_courant,
        vca_adate,
        vca_adate_date,
        vcg,
        taa_courant,
        taa_adate,
        tag
    FROM {{ ref('compute_ta_indic') }} AS a
    LEFT JOIN
        {{ ref('stg_ppg_metadata__indicateurs') }} AS b
        ON a.indic_id = b.id
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS z ON a.zone_id = z.id
--order by chantier_id, zone_id, metric_date, indic_id
),

-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond AS (
    SELECT
        a.*,
        b.poids_zone_reel,
        taa_courant * 0.01 * b.poids_zone_reel AS taa_courant_pond,
        taa_adate * 0.01 * b.poids_zone_reel AS taa_adate_pond,
        tag * 0.01 * b.poids_zone_reel AS tag_pond
    FROM ta_zone_indic AS a
    LEFT JOIN
        {{ ref('int_ponderation_reelle') }} AS b
        ON a.indic_id = b.indic_id AND a.zone_id = b.zone_id
    ORDER BY chantier_id, zone_id, metric_date, indic_id
),

-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_today
ta_zone_indic_pond_today AS (
    SELECT * FROM (
        SELECT
            a.*,
            RANK()
                OVER (
                    PARTITION BY a.zone_id, a.indic_id
                    ORDER BY a.metric_date DESC
                )
                AS r,
            b.max_date_taa_courant_today AS max_date,
            'today' AS valid_on
        FROM ta_zone_indic_pond AS a
        LEFT JOIN
            {{ ref('get_max_date_vaca_ch') }} AS b
            ON a.chantier_id = b.chantier_id AND a.zone_id = b.zone_id
        WHERE
            vaca IS NOT NULL
            AND metric_date <= max_date_taa_courant_today
    ) AS a
    WHERE a.r = 1
),

-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_previous
ta_zone_indic_pond_prev_month AS (
    SELECT * FROM (
        SELECT
            a.*,
            RANK()
                OVER (
                    PARTITION BY a.zone_id, a.indic_id
                    ORDER BY a.metric_date DESC
                )
                AS r,
            b.max_date_taa_courant_previous AS max_date,
            'prev_month' AS valid_on
        FROM ta_zone_indic_pond AS a
        LEFT JOIN
            {{ ref('get_max_date_vaca_ch') }} AS b
            ON a.chantier_id = b.chantier_id AND a.zone_id = b.zone_id
        WHERE
            vaca IS NOT NULL
            AND metric_date <= max_date_taa_courant_previous
    ) AS a
    WHERE a.r = 1
),

-- Calcul du TA chantier intermediaire 
--		car sans prendre en compte le nombre de TA indic remontés pour ce CH (PIL-227)
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
        -- Calcul du TA par somme des TA pondérés et bornage dans [0,100] (+handle null)
        CASE
            WHEN BOOL_OR(a.taa_courant_pond IS NULL) THEN NULL
            WHEN SUM(a.taa_courant_pond) > 100 THEN 100
            WHEN SUM(a.taa_courant_pond) < 0 THEN 0
            ELSE ROUND(SUM(a.taa_courant_pond)::NUMERIC, 3)
        END AS taa_courant_ch_int,
        -- [adate] Calcul du TA par somme des TA pondérés et bornage dans [0,100] (+handle null)
        CASE
            WHEN BOOL_OR(a.taa_adate_pond IS NULL) THEN NULL
            WHEN SUM(a.taa_adate_pond) > 100 THEN 100
            WHEN SUM(a.taa_adate_pond) < 0 THEN 0
            ELSE ROUND(SUM(a.taa_adate_pond)::NUMERIC, 3)
        END AS taa_adate_ch_int,
        CASE
            WHEN BOOL_OR(a.tag_pond IS NULL) THEN NULL
            WHEN SUM(a.tag_pond) > 100 THEN 100
            WHEN SUM(a.tag_pond) < 0 THEN 0
            ELSE ROUND(SUM(a.tag_pond)::NUMERIC, 3)
        END AS tag_ch_int,
        -- (PIL-253) Date du TA= date la plus tardive des VA indic du chantier
        MAX(a.metric_date) AS date_ta_int
    FROM
        (
            -- On ne considère que les TA dont les indicateurs ont une pondération réelle > 0
            -- 	pour le calcul du TA chantier (ie la somme des TA indicateurs pondérés)
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
        a.*,
        t.code AS territoire_code
    FROM ta_ch_int AS a
    LEFT JOIN
        {{ source('db_schema_public', 'territoire') }} AS t
        ON a.zone_id = t.zone_id
),

-- Ajout du nombre d'indics attendus pour chaque {chantier-zone}: n_indic_in_ta_expected
ta_ch_terr_code_indic_expected AS (
    SELECT
        a.*,
        b.n_indic_in_ta_expected
    FROM ta_ch_int_terr_code AS a
    LEFT JOIN
        {{ ref('get_n_indic_in_ta_expected') }} AS b
        ON a.chantier_id = b.chantier_id AND a.zone_id = b.zone_id
),

ta_ch_no_date AS (
-- (PIL-227) Ici, on va vérifier pour chaque {zone-chantier} que l'on a bien combiné le nombre de TA indic que l'on attendait.
--		On compare le nombre de TA indic combiné, avec le nombre d'indics ayant une pondération non vide
    SELECT
        *,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected THEN taa_courant_ch_int
        END AS taa_courant_ch,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected THEN taa_adate_ch_int
        END AS taa_adate_ch,
        CASE
            WHEN n_indic_in_ta = n_indic_in_ta_expected THEN tag_ch_int
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
