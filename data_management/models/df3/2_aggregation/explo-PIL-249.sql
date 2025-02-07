WITH src AS (
    SELECT
        indicateur_id AS indic_id,
        vi_reg_from,
        vi_reg_op,
        va_reg_from,
        vc_reg_from,
        vi_nat_from,
        va_nat_from,
        vc_nat_from
    FROM raw_data.stg_ppg_metadata__parametrage_indicateurs
    WHERE indicateur_id = 'IND-895'
),

valeurs AS (
    SELECT
        indic_id,
        metric_type,
        metric_date,
        metric_value,
        zone_id,
        b.maille
    FROM df3.mesure_last_null_erase_keep_lastvalmonth AS a
    LEFT JOIN raw_data.stg_ppg_metadata__zones AS b ON a.zone_id = b.id
)
,

vi_dept_agg_to_reg AS (
    SELECT
        a.indic_id,
        c.zone_parent,
        b.zone_id,

        b.metric_type,
        b.metric_date,
        b.metric_value,
        b.maille,
        row_number()
            OVER (
                PARTITION BY a.indic_id, b.zone_id
                ORDER BY b.metric_date::date ASC
            )
        AS r,
        a.vi_reg_op
    FROM src AS a
    LEFT JOIN
        valeurs AS b
        ON a.indic_id = b.indic_id AND a.vi_reg_from = 'DEPT'
    LEFT JOIN df3.zone_parent AS c ON b.zone_id = c.zone_id
    WHERE b.metric_type = 'vi' AND c.zone_parent_type = 'REG'
    ORDER BY indic_id, zone_parent

)



SELECT * FROM vi_dept_agg_to_reg
