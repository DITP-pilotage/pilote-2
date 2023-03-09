with

import_date as (

    SELECT NOW() as date

)

SELECT
    {{ dbt_utils.surrogate_key(
             ['indic_id',
             'zone_id',
             'metric_date',
             'metric_type',
             'import_date.date']
    ) }} as id,
    indic_id,
    zone_id,
    TO_DATE(metric_date,'DD/MM/YYYY') as metric_date,
    metric_type,
    metric_value::INTEGER,
    import_date.date as import_date
FROM {{ source('import_metrics_indicateurs', 'temp_metric_indicateur') }}, import_date

