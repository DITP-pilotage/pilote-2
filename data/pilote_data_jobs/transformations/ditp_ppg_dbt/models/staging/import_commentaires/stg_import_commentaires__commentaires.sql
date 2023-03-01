with

source as (

    select * from {{ ref('commentaires') }}

),

renamed as (

    select
        chantier_id as id,
        type,
        contenu,
        date,
        nom as auteur

    from source

)

select * from renamed