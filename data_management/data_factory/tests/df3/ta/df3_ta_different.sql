{{ config(enabled=true, tags=["scope_indicateur", "metric_ta"]) }}

{{ df3_not_equal('objectif_taux_avancement') }}