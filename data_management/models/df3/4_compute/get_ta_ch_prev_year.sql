SELECT 
    -- *,
    chantier_id,
    zone_id,
    territoire_code,
    indic_ids,
    date_ta as taa_prev_year_date, -- correct ?
    taa_prev_year_ch as taa_prev_year,
    tag_ch as tag_prev_year
FROM {{ ref('compute_ta_ch') }}
WHERE valid_on = 'prev_year'
