{{ config(enabled=true, tags=["scope_indicateur", "metric_ta"]) }}

{{ df3_should_notnull('objectif_taux_avancement') }}