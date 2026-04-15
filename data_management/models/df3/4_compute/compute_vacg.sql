-- Détermine le valeurs de VACG pour chaque mesure

-- on joint les mesures avec les params associés
WITH mesures_and_params AS (
    SELECT
        a.*,
        b.param_vacg_decumul_from,
        b.param_vacg_partition_date,
        b.param_vacg_op
    FROM {{ ref('pivot_mesures') }} AS a
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }}
            AS b
        ON a.indic_id = b.indic_id
),

-- On détermine la date de décumul des VA
add_decumul_start_date AS (
    SELECT
        *,
        -- Date pour effectuer le decumul des VA
        CASE
        -- Si from_year_start -> 1er janvier de l'année de la mesure
            WHEN
                param_vacg_decumul_from = 'from_year_start'
                THEN DATE_TRUNC('year', metric_date)
            -- Si from_custom_date::X -> date X
            WHEN
                param_vacg_decumul_from LIKE 'from_custom_date::%'
                THEN
                    SPLIT_PART(
                        param_vacg_decumul_from, 'from_custom_date::', 2
                    )::DATE
        -- Sinon, pas de date de début de décumul
        END AS decumul_vag_date,
        -- Date pour effectuer le calcul des VACG
        CASE
            -- Si from_year_start -> 1er janvier de l'année de la mesure
            WHEN
                param_vacg_partition_date = 'from_year_start'
                THEN DATE_TRUNC('year', metric_date)
            -- Si from_custom_date::X -> date X
            WHEN
                param_vacg_partition_date LIKE 'from_custom_date::%'
                THEN
                    SPLIT_PART(
                        param_vacg_partition_date, 'from_custom_date::', 2
                    )::DATE
        -- Sinon, pas de date de début de décumul
        END AS vacg_partition_date
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
            WHEN param_vacg_decumul_from = '_' THEN va
            -- Sinon, on soustraite la va courante à la va précédente, dans la limite de la fenetre définie par decumul_vag_date
            ELSE
                COALESCE(
                    va
                    - LAG(va, 1)
                        OVER (PARTITION BY indic_id, zone_id, decumul_vag_date ORDER BY metric_date),
                    va
                )
        END AS va_decumul
    FROM add_decumul_start_date
),

-- Calcul du VACG
compute_vacg AS (
    SELECT
        *,
        CASE
        -- pas de calcul de vacg si pas de va 
            WHEN va IS NULL THEN NULL
            -- Si 'current_value' -> on retourne directement va_decumul sans plus de calcul 
            WHEN param_vacg_op = 'current_value' THEN va_decumul
            WHEN param_vacg_partition_date = '_' THEN va_decumul
            -- sum avec les différentes fenetres autorisées
            WHEN
                param_vacg_partition_date = 'from_previous_month::48'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER w48
            WHEN
                param_vacg_partition_date = 'from_previous_month::12'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER w12
            WHEN
                param_vacg_partition_date = 'from_previous_month::6'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER w6
            WHEN
                param_vacg_partition_date = 'from_previous_month::3'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER w3
            -- avg avec les différentes fenetres autorisées
            WHEN
                param_vacg_partition_date = 'from_previous_month::48'
                AND param_vacg_op = 'moy'
                THEN AVG(va_decumul) OVER w48
            WHEN
                param_vacg_partition_date = 'from_previous_month::12'
                AND param_vacg_op = 'moy'
                THEN AVG(va_decumul) OVER w12
            WHEN
                param_vacg_partition_date = 'from_previous_month::6'
                AND param_vacg_op = 'moy'
                THEN AVG(va_decumul) OVER w6
            WHEN
                param_vacg_partition_date = 'from_previous_month::3'
                AND param_vacg_op = 'moy'
                THEN AVG(va_decumul) OVER w3
            -- si calcul de VACG avec from_year_start
            WHEN
                param_vacg_partition_date = 'from_year_start'
                AND param_vacg_op = 'sum'
                THEN
                    SUM(va_decumul)
                        OVER (
                            PARTITION BY
                                indic_id,
                                zone_id,
                                DATE_TRUNC('year', metric_date)
                            ORDER BY metric_date
                        )
            WHEN
                param_vacg_partition_date = 'from_year_start'
                AND param_vacg_op = 'moy'
                THEN
                    AVG(va_decumul)
                        OVER (
                            PARTITION BY
                                indic_id,
                                zone_id,
                                DATE_TRUNC('year', metric_date)
                            ORDER BY metric_date
                        )
            -- si calcul de VACG avec from_custom_date
            WHEN
                param_vacg_partition_date LIKE 'from_custom_date::%'
                AND param_vacg_op = 'sum'
                THEN
                    SUM(va_decumul)
                        OVER (
                            PARTITION BY indic_id, zone_id, vacg_partition_date
                            ORDER BY metric_date
                        )
            WHEN
                param_vacg_partition_date LIKE 'from_custom_date::%'
                AND param_vacg_op = 'moy'
                THEN
                    AVG(va_decumul)
                        OVER (
                            PARTITION BY indic_id, zone_id, vacg_partition_date
                            ORDER BY metric_date
                        )
        END AS vacg
    FROM perform_decumul
    WINDOW
        w48 AS (
            PARTITION BY indic_id, zone_id
            ORDER BY
                DATE_TRUNC('month', metric_date) ASC
            RANGE BETWEEN INTERVAL '47 months' PRECEDING AND CURRENT ROW
        ),
        w12 AS (
            PARTITION BY indic_id, zone_id
            ORDER BY
                DATE_TRUNC('month', metric_date) ASC
            RANGE BETWEEN INTERVAL '11 months' PRECEDING AND CURRENT ROW
        ),
        w6 AS (
            PARTITION BY indic_id, zone_id
            ORDER BY
                DATE_TRUNC('month', metric_date) ASC
            RANGE BETWEEN INTERVAL '5 months' PRECEDING AND CURRENT ROW
        ),
        w3 AS (
            PARTITION BY indic_id, zone_id
            ORDER BY
                DATE_TRUNC('month', metric_date) ASC
            RANGE BETWEEN INTERVAL '2 months' PRECEDING AND CURRENT ROW
        )

)

SELECT * FROM compute_vacg
