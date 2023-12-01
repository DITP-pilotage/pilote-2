-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vcg"]) }}

{{ df3_not_equal('objectif_valeur_cible') }}
