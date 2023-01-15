with

source as (

    select * from {{ source('dfakto', 'fact_progress_indicateur') }}

),

renamed as (

    select
        tree_node_id,
        effect_id,
        period_id,
        tag_applied as etiquettes,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        progress as avancement,
        bounded_progress as avancement_borne,
        date_valeur_initiale,
        date_valeur_actuelle,
        date_valeur_cible,
        snapshot_date
    from source

)

select * from renamed