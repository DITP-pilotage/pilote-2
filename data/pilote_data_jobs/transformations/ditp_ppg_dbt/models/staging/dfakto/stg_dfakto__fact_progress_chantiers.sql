with

source as (

    select * from {{ ref('fact_progress_chantiers') }}

),

renamed as (

    select
        tree_node_id,
        progress_intermediaire as avancement_annuel,
        progress_globale as avancement,
        progress_globale as avancement_borne,
        snapshot_date
    from source

)

select * from renamed