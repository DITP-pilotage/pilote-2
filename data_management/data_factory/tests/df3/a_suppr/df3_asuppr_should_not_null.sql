-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_asuppr"]) }}

{{ df3_should_notnull('a_supprimer') }}