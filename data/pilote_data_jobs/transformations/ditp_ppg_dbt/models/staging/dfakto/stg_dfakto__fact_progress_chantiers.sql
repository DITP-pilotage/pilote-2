with

source as (

    select * from {{ ref('fact_progress_chantiers') }}

),

renamed as (

    select
        tree_node_id,
        period_id,
        progress as avancement,
        bounded_progress as avancement_borne,
        is_representative as est_representatif,
        snapshot_date
    from source

)

select * from renamed