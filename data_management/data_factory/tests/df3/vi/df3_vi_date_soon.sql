-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vi"]) }}

{{ df3_date_early('date_valeur_initiale', 'TRUE') }}