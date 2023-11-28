{{ config(enabled=true, tags=["scope_indicateur", "metric_vcg"]) }}

{{ df3_should_notnull('objectif_date_valeur_cible') }}
