

with

source as (

    select * from "dev_pilote__6230"."raw_data"."commentaires"

),

renamed as (

    select
        chantier_id,
        type,
        contenu,
        TO_DATE(date,'DD/MM/YYYY') as date,
        NULL::TEXT as auteur,
        auteur_email,
        maille,
        CAST(code_insee as VARCHAR) as code_insee,
        TO_DATE(date_meteo,'DD/MM/YYYY') as date_meteo,
        meteo
    from source

)

select * from renamed