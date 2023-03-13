with

source as (

    select * from {{ ref('fact_progress_chantiers') }}

),

renamed as (

    select
        tree_node_id,
        progress_intermediaire as avancement_annuel,
        progress_globale as avancement,
        snapshot_date
    from source

)

select * from renamed