-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_vca"]) }}

{{ df3_date_early('objectif_date_valeur_cible_intermediaire', 'TRUE') }}
