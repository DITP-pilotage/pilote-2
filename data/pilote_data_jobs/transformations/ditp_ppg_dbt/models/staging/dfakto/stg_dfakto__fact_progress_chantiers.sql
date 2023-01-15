with

source as (

    select * from {{ source('dfakto', 'fact_progress_chantier') }}

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