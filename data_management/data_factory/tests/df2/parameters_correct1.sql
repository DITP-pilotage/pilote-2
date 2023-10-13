{{ config(
    enabled=true,
    tags=["df2", "scope_params", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Si param_vaca_op <> current_value alors param_vaca_partition_date ne peut PAS être '_'
--  En effet, si l'on demande de faire une op d'aggrégation des VA, il faut savoir sur quel horizon de temps le faire
select * from {{ ref('metadata_parametrage_indicateurs') }}
where param_vaca_op <> 'current_value' AND param_vaca_partition_date = '_'