with

source as (

    select * from {{ ref('commentaires') }}

),

renamed as (

    select
        chantier_id as id,
        type,
        contenu,
        TO_DATE(date,'DD/MM/YYYY') as date,
        nom as auteur

    from source

)

select * from renamed