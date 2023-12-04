-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_baro"]) }}

{{ df3_should_notnull('est_barometre') }}