with

source as (

    select * from {{ ref('fact_progress_indicateurs') }}

),

renamed as (

    select
        tree_node_id,
        effect_id,
        CAST(valeur_initiale as DOUBLE PRECISION) as valeur_initiale,
        CAST(valeur_actuelle as DOUBLE PRECISION) as valeur_actuelle,
        CAST(valeur_cible_intermediaire as DOUBLE PRECISION) as valeur_cible_annuel,
        CAST(valeur_cible_globale as DOUBLE PRECISION) as valeur_cible_globale,
        CAST(progress_intermediaire as DOUBLE PRECISION) as avancement_annuel,
        CAST(bounded_progress_intermediaire as DOUBLE PRECISION) as avancement_borne_annuel,
        CAST(progress_globale as DOUBLE PRECISION) as avancement, -- TODO A RENOMMER pour global
        CAST(bounded_progress_globale as DOUBLE PRECISION) as avancement_borne, -- TODO A RENOMMER pour global
        date_valeur_initiale::DATE,
        date_valeur_actuelle::DATE,
        date_valeur_cible_intermediaire::DATE as date_valeur_cible_annuel,
        date_valeur_cible_globale::DATE,
        snapshot_date
    from source

)

select * from renamed