{{ config(enabled=true, tags=["scope_indicateur", "metric_zappl"]) }}

{{ df3_should_notnull('est_applicable') }}