with

source as (

    select * from {{ ref('fact_progress_kpis') }}

),

renamed as (

    select
        tree_node_id,
        kpi_id,
        kpi_name as kpi_nom,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        progress as avancement,
        date_last_update_valeur_initiale as date_valeur_initiale,
        date_last_update_valeur_actuelle as date_valeur_actuelle,
        date_last_update_valeur_cible as date_valeur_cible,
        bounded_progress as avancement_borne

        from source

)

select * from renamed