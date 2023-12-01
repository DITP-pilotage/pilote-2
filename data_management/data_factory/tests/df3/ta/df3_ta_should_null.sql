-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_ta"]) }}

{{ df3_should_null('objectif_taux_avancement') }}