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
        code_insee

    from source

)

select * from renamed
