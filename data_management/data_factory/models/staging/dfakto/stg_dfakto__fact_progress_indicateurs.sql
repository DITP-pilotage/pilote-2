with

source as (

    select * from {{ ref('fact_progress_indicateurs') }}

),

renamed as (

    select
        tree_node_id,
        effect_id,
        CAST(REPLACE(valeur_initiale, ',', '') as DOUBLE PRECISION) as valeur_initiale,
        CAST(REPLACE(valeur_actuelle, ',', '') as DOUBLE PRECISION) as valeur_actuelle,
        CAST(REPLACE(valeur_cible_intermediaire, ',', '') as DOUBLE PRECISION) as valeur_cible_annuel,
        CAST(REPLACE(valeur_cible_globale, ',', '') as DOUBLE PRECISION) as valeur_cible_globale,
        progress_intermediaire as avancement_annuel,
        bounded_progress_intermediaire as avancement_borne_annuel,
        progress_globale as avancement, -- TODO A RENOMMER pour global
        bounded_progress_globale as avancement_borne, -- TODO A RENOMMER pour global
        date_valeur_initiale::DATE,
        date_valeur_actuelle::DATE,
        date_valeur_cible_intermediaire::DATE as date_valeur_cible_annuel,
        date_valeur_cible_globale::DATE,
        completude_intermediaire,
        completude_globale,
        snapshot_date
    from source

)

select * from renamed