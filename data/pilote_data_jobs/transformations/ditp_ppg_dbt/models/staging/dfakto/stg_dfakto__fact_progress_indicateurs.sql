with

source as (

    select * from {{ ref('fact_progress_indicateurs') }}

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
        date_valeur_initiale::DATE,
        date_valeur_actuelle::DATE,
        date_valeur_cible::DATE,
        snapshot_date
    from source

)

select * from renamed