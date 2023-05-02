with

source as (

    select * from {{ ref('ps_view_data_kpis') }}

),

renamed as (

    select maille_name as territoire_nom,
        maille_code as zone_code,
        ps_name as projet_structurant_nom,
        ps_code as projet_structurant_code,
        effect_name as indicateur_nom,
        unite,
        categorie as type_nom,
        description as indicateur_description,
        vi as valeur_initiale,
        va as valeur_actuelle,
        vc as valeur_cible,
        ta as taux_avancement,
        vi_maj as valeur_initiale_date,
        va_maj as valeur_actuelle_date,
        vc_maj as valeur_cible_date
    from source

)

select * from renamed
