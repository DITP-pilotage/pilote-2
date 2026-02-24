SELECT
    date_import,
    indic_id,
    metric_date::DATE,
    DATE_TRUNC('month', metric_date::DATE)::DATE AS metric_month,
    metric_type::TEXT,
    (CASE
        WHEN metric_value IN ('', 'null', 'undefined')
            THEN NULL
        ELSE metric_value
    END)::NUMERIC AS metric_value,
    zone_id,
    id,
    rapport_id
FROM {{ source('import_from_files', 'mesure_indicateur') }}
