with

source as (

    select * from {{ ref('commentaires') }}

),

renamed as (

    select
        chantier_id,
        type,
        contenu,
        TO_DATE(date,'DD/MM/YYYY') as date,
        auteur,
        maille,
        CAST(code_insee as VARCHAR) as code_insee,
        TO_DATE(date_meteo,'DD/MM/YYYY') as date_meteo,
        meteo

    from source

)

select * from renamed
