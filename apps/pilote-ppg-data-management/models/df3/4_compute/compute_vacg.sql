-- Détermine le valeurs de VACG pour chaque mesure

-- on joint les mesures avec les params associés
WITH mesures_and_params AS (
    SELECT
        pivot_mesures.*,
        parametre_indic.param_vacg_decumul_from,
        parametre_indic.param_vacg_partition_date,
        parametre_indic.param_vacg_op
    FROM {{ ref('pivot_mesures') }} AS pivot_mesures
    LEFT JOIN
        {{ source('ppg_metadata', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
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
                param_vacg_decumul_from = 'from_year_start'
                THEN DATE_TRUNC('year', metric_date)
        -- Sinon (from_beginning), pas de date : le décumul porte sur tout
        -- l'historique de l'indicateur
        END AS decumul_vag_date
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
            -- Sinon, on soustrait la va courante à la va précédente,
            -- dans la limite de la fenetre définie par decumul_vag_date
            ELSE
                COALESCE(
                    va
                    - LAG(va, 1)
                        OVER (
                            PARTITION BY indic_id, zone_id, decumul_vag_date
                            ORDER BY metric_date
                        ),
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
            -- Si 'current_value' -> on retourne va_decumul
            WHEN param_vacg_op = 'current_value' THEN va_decumul
            WHEN param_vacg_partition_date = '_' THEN va_decumul
            -- sum sur les 12 derniers mois glissants
            WHEN
                param_vacg_partition_date = 'from_previous_month::12'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER w12
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
            -- si calcul de VACG avec from_beginning : sur tout l'historique
            WHEN
                param_vacg_partition_date = 'from_beginning'
                AND param_vacg_op = 'sum'
                THEN SUM(va_decumul) OVER (
                    PARTITION BY indic_id, zone_id
                    ORDER BY metric_date
                )
        END AS vacg
    FROM perform_decumul
    WINDOW
        w12 AS (
            PARTITION BY indic_id, zone_id
            ORDER BY
                DATE_TRUNC('month', metric_date) ASC
            RANGE BETWEEN INTERVAL '11 months' PRECEDING AND CURRENT ROW
        )

)

SELECT * FROM compute_vacg
