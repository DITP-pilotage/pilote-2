-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vi"]) }}

{{ df3_not_equal('valeur_initiale') }}
