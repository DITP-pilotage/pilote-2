-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_va"]) }}

{{ df3_not_equal('valeur_actuelle') }}