with

source as (

    select * from {{ ref('fact_progress_project') }}

),

renamed as (

    select
        tree_node_id,
        progress as avancement,
        bounded_progress as avancement_borne
        from source

)

select * from renamed