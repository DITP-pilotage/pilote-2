-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vi"]) }}

{{ df3_should_notnull('date_valeur_initiale') }}