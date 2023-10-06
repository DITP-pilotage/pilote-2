with

source as (

    select * from {{ ref('fact_progress_indicateurs') }}

),

renamed as (

    select
        tree_node_id,
        effect_id,
        valeur_initiale_visualisation as valeur_initiale,
        valeur_actuelle as valeur_actuelle,
        valeur_cible_intermediaire as valeur_cible_intermediaire,
        valeur_cible_globale as valeur_cible_globale,
        progress_intermediaire as avancement_annuel,
        bounded_progress_intermediaire as avancement_borne_intermediaire,
        progress_globale as avancement, -- TODO A RENOMMER pour global
        bounded_progress_globale as avancement_borne, -- TODO A RENOMMER pour global
        date_valeur_initiale_visualisation::DATE as date_valeur_initiale,
        date_valeur_actuelle::DATE,
        date_valeur_cible_intermediaire::DATE as date_valeur_cible_intermediaire,
        date_valeur_cible_globale::DATE,
        completude_intermediaire,
        completude_globale,
        snapshot_date
    from source

)

select * from renamed