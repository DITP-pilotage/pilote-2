{{ config(schema = 'raw_data') }}

select 
    "date_import"::timestamptz(3),
    "indic_id","metric_date","metric_type","metric_value","zone_id",
    "id"::uuid,
    "rapport_id"::uuid

from {{ ref('mesure_indicateur_py') }}
