-- depends_on: {{ ref('rapport_import_mesure_indicateur') }}

SELECT
    date_import::TIMESTAMPTZ (3),
    indic_id,
    metric_date,
    metric_type,
    metric_value,
    zone_id,
    id::UUID,
    rapport_id::UUID

FROM {{ source('python_load_seeds', 'mesure_indicateur_py') }}
