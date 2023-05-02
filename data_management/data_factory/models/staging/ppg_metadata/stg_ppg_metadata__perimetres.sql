with

source as (

    select * from {{ ref('metadata_perimetres') }}

),

renamed as (

    select
        perimetre_id as id,
        per_nom as nom,
        per_short as polygramme,
        per_picto as pictogramme,
        per_porteur_id::text as ministere_id,
        per_porteur_name_short as ministere_nom

    from source

)

select * from renamed