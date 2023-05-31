with

source as (

    select * from {{ ref('metadata_parametrage_indicateurs') }}

),

renamed as (

    select
        indic_id as indicateur_id,
        vi_dept_from,
        vi_dept_op,
        va_dept_from,
        va_dept_op,
        vc_dept_from,
        vc_dept_op,
        vi_reg_from,
        vi_reg_op,
        va_reg_from,
        va_reg_op,
        vc_reg_from,
        vc_reg_op,
        vi_nat_from,
        vi_nat_op,
        va_nat_from,
        va_nat_op,
        vc_nat_from,
        vc_nat_op,
        SPLIT_PART(param_vaca_decumul_from, '::', 1) as decumule_vaa_par,
        TO_DATE(NULLIF(SPLIT_PART(param_vaca_decumul_from, '::', 2), ''), 'YYYY-MM-DD') as decumule_vaa_depuis,
        SPLIT_PART(param_vaca_partition_date, '::', 1) as partitionne_vaca_par,
        TO_DATE(NULLIF(SPLIT_PART(param_vaca_partition_date, '::', 2), ''), 'YYYY-MM-DD') as partitionne_vaca_depuis,
        param_vaca_op as vaca_operation,
        SPLIT_PART(param_vacg_decumul_from, '::', 1) as decumule_vag_par,
        TO_DATE(NULLIF(SPLIT_PART(param_vacg_decumul_from, '::', 2), ''), 'YYYY-MM-DD') as decumule_vag_depuis,
        SPLIT_PART(param_vacg_partition_date, '::', 1) as partitionne_vacg_par,
        TO_DATE(NULLIF(SPLIT_PART(param_vacg_partition_date, '::', 2), ''), 'YYYY-MM-DD') as partitionne_vacg_depuis,
        param_vacg_op as vacg_operation,
        poids_pourcent_dept,
        poids_pourcent_reg,
        poids_pourcent_nat

    from source

)

select * from renamed