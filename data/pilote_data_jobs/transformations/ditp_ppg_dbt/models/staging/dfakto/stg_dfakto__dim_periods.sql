with

source as (

    select * from {{ ref('dim_periods') }}

),

    -- Il reste du renommage à faire
renamed as (

    select
        period_id as id,
        period_date::TIMESTAMP as date,
        period_year as annee,
        period_month as mois,
        period_month_tri as mois_polygramme,
        period_month_year as mois_annee,
        period_month_year_tri as mois_annee_poly,
        period_quarter as trimestre,
        period_quarter_year as trimestre_annee,
        period_year_in_time,
        period_month_in_time,
        period_quarter_in_time,
        period_current_year_flag,
        period_current_month_flag,
        period_current_quarter_flag,
        period_last_year_flag,
        period_last_month_flag,
        period_last_quarter_flag,
        period_next_year_flag,
        period_next_month_flag,
        period_next_quarter_flag,
        snapshot_date
    from source

)

select * from renamed