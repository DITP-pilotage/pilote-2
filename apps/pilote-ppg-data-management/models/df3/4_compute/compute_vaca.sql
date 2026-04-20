-- Détermine le valeurs de VACA pour chaque mesure

-- on joint les mesures avec les params associés
WITH mesures_and_params AS (
    SELECT
        pivot_mesures.*,
        parametre_indic.param_vaca_decumul_from,
        parametre_indic.param_vaca_partition_date,
        parametre_indic.param_vaca_op
    FROM {{ ref('pivot_mesures') }} AS pivot_mesures
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS parametre_indic
        ON pivot_mesures.indic_id = parametre_indic.indic_id
),

-- On détermine la date de décumul des VA
add_decumul_start_date AS (
    SELECT
        *,
        -- Date pour effectuer le decumul des VA
        CASE
        -- Si from_year_start -> 1er janvier de l'année de la mesure
            WHEN
                param_vaca_decumul_from = 'from_year_start'
                THEN DATE_TRUNC('year', metric_date)
            -- Si from_custom_date::X -> date X
            WHEN param_vaca_decumul_from LIKE 'from_custom_date::%'
                THEN SPLIT_PART(
                    param_vaca_decumul_from,
                    'from_custom_date::',
                    2
                )::DATE
        -- Sinon, pas de date de début de décumul
        END AS decumul_vaa_date,
        -- Date pour effectuer le calcul des VACA
        CASE
        -- Si from_year_start -> 1er janvier de l'année de la mesure
            WHEN
                param_vaca_partition_date = 'from_year_start'
                THEN DATE_TRUNC('year', metric_date)
            -- Si from_custom_date::X -> date X
            WHEN param_vaca_partition_date LIKE 'from_custom_date::%'
                THEN SPLIT_PART(
                    param_vaca_partition_date,
                    'from_custom_date::',
                    2
                )::DATE
        -- Sinon, pas de date de début de décumul
        END AS vaca_partition_date
    FROM mesures_and_params
),

-- On fait le décumul
perform_decumul AS (
    SELECT
        *,
        CASE
        -- pas de calcul de va_decumul si pas de va
            WHEN va IS NULL THEN NULL
            -- Si '_' -> on retourne va car pas de décumul demandé
            WHEN param_vaca_decumul_from = '_' THEN va
            -- Sinon, on soustrait la va courante à la va précédente,
            -- dans la limite de la fenetre définie par decumul_vaa_date
            ELSE COALESCE(
                va - LAG(va, 1) OVER (
                    PARTITION BY
                        indic_id,
                        zone_id,
                        decumul_vaa_date
                    ORDER BY metric_date ASC
                ),
                va
            )
        END AS va_decumul
    FROM add_decumul_start_date
),

-- Calcul du VACA
compute_vaca AS (
    SELECT
        *,
        CASE
        -- pas de calcul de vaca si pas de va 
            WHEN va IS NULL THEN NULL
            -- Si 'current_value' on retourne va_decumul
            WHEN param_vaca_op = 'current_value' THEN va_decumul
            WHEN param_vaca_partition_date = '_' THEN va_decumul
            -- TODO : Use macro ?
            -- Sum using case when instead of window functions ?
            -- sum avec les différentes fenetres autorisées
            WHEN
                param_vaca_partition_date = 'from_previous_month::48'
                AND param_vaca_op = 'sum' THEN SUM(va_decumul) OVER w48
            WHEN
                param_vaca_partition_date = 'from_previous_month::12'
                AND param_vaca_op = 'sum' THEN SUM(va_decumul) OVER w12
            WHEN
                param_vaca_partition_date = 'from_previous_month::6'
                AND param_vaca_op = 'sum' THEN SUM(va_decumul) OVER w6
            WHEN
                param_vaca_partition_date = 'from_previous_month::3'
                AND param_vaca_op = 'sum' THEN SUM(va_decumul) OVER w3
            -- avg avec les différentes fenetres autorisées
            WHEN
                param_vaca_partition_date = 'from_previous_month::48'
                AND param_vaca_op = 'moy' THEN AVG(va_decumul) OVER w48
            WHEN
                param_vaca_partition_date = 'from_previous_month::12'
                AND param_vaca_op = 'moy' THEN AVG(va_decumul) OVER w12
            WHEN
                param_vaca_partition_date = 'from_previous_month::6'
                AND param_vaca_op = 'moy' THEN AVG(va_decumul) OVER w6
            WHEN
                param_vaca_partition_date = 'from_previous_month::3'
                AND param_vaca_op = 'moy' THEN AVG(va_decumul) OVER w3
            -- si calcul de VACA avec from_year_start
            WHEN
                param_vaca_partition_date = 'from_year_start'
                AND param_vaca_op = 'sum'
                THEN SUM(va_decumul) OVER (
                    PARTITION BY
                        indic_id,
                        zone_id,
                        DATE_TRUNC('year', metric_date)
                    ORDER BY metric_date
                )
            WHEN
                param_vaca_partition_date = 'from_year_start'
                AND param_vaca_op = 'moy'
                THEN AVG(va_decumul) OVER (
                    PARTITION BY
                        indic_id,
                        zone_id,
                        DATE_TRUNC('year', metric_date)
                    ORDER BY metric_date
                )
            -- si calcul de VACA avec from_custom_date
            WHEN
                param_vaca_partition_date LIKE 'from_custom_date::%'
                AND param_vaca_op = 'sum'
                THEN SUM(va_decumul) OVER (
                    PARTITION BY
                        indic_id,
                        zone_id,
                        vaca_partition_date
                    ORDER BY metric_date
                )
            WHEN
                param_vaca_partition_date LIKE 'from_custom_date::%'
                AND param_vaca_op = 'moy'
                THEN AVG(va_decumul) OVER (
                    PARTITION BY
                        indic_id,
                        zone_id,
                        vaca_partition_date
                    ORDER BY metric_date
                )
        END AS vaca
    FROM perform_decumul
    WINDOW w48 AS (
        PARTITION BY
            indic_id, zone_id
        ORDER BY
            DATE_TRUNC('month', metric_date) ASC
        RANGE BETWEEN INTERVAL '47 months' PRECEDING
        AND CURRENT ROW
    ), w12 AS (
        PARTITION BY
            indic_id, zone_id
        ORDER BY
            DATE_TRUNC('month', metric_date) ASC
        RANGE BETWEEN INTERVAL '11 months' PRECEDING
        AND CURRENT ROW
    ), w6 AS (
        PARTITION BY
            indic_id, zone_id
        ORDER BY
            DATE_TRUNC('month', metric_date) ASC
        RANGE BETWEEN INTERVAL '5 months' PRECEDING
        AND CURRENT ROW
    ), w3 AS (
        PARTITION BY
            indic_id, zone_id
        ORDER BY
            DATE_TRUNC('month', metric_date) ASC
        RANGE BETWEEN INTERVAL '2 months' PRECEDING
        AND CURRENT ROW
    )
)

SELECT * FROM compute_vaca
