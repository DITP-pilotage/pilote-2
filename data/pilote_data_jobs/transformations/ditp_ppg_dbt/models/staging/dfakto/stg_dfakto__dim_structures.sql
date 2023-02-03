with

source as (

    select * from {{ ref('dim_structures') }}

),

renamed as (

    select
        structure_id as id,
        top_level_id,
        structure_name as nom,
        structure_is_part_of_update_period as is_part_of_update_period,
        structure_scorecard_frequency as scorecard_frequency,
        structure_is_hidden as is_hidden,
        structure_has_correction as has_correction,
        structure_level as level,
        snapshot_date
    from source

)

select * from renamed