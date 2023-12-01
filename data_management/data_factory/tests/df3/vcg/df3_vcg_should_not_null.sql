-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vcg"]) }}

{{ df3_should_notnull('objectif_valeur_cible') }}
