WITH

source AS (

    SELECT *
    FROM
        "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" -- noqa: LT05

),

renamed AS (

    SELECT
        indic_id AS indicateur_id,
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
        param_vaca_decumul_from AS decumule_vaa_par,
        SPLIT_PART(param_vaca_partition_date, '::', 1) AS partitionne_vaca_par,
        param_vaca_op AS vaca_operation,
        param_vacg_decumul_from AS decumule_vag_par,
        SPLIT_PART(param_vacg_partition_date, '::', 1) AS partitionne_vacg_par,
        param_vacg_op AS vacg_operation,
        poids_pourcent_dept_declaree,
        poids_pourcent_reg_declaree,
        poids_pourcent_nat_declaree,
        tendance

    FROM source

)

SELECT * FROM renamed