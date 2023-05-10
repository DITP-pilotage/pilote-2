with

source as (

    select * from {{ ref('metadata_config_vac') }}

),

renamed as (

    select
        indic_id as indicateur_id,
        SPLIT_PART(param_vac_partition_date, '::', 1) as partitionne_par,
        NULLIF(SPLIT_PART(param_vac_partition_date, '::', 2), '') as partitionne_depuis,
        param_vac_op as operation,
        param_decumul as a_decumule,
        SPLIT_PART(param_decumul_from, '::', 1) as decumule_par,
        TO_DATE(NULLIF(SPLIT_PART(param_decumul_from, '::', 2), ''), 'YYYY-MM-DD') as decumule_depuis

    from source

)

select * from renamed