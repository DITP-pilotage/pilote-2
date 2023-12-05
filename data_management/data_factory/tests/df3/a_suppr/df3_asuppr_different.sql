-- depends_on: {{ ref('df1_indicateur') }}
{{ config(enabled=true, tags=["scope_indicateur", "metric_asuppr"]) }}

{{ df3_not_equal_bool('a_supprimer') }}