with

source as (

    select * from {{ ref('fact_property_values') }}

),

renamed as (

    select
        tree_node_id,
        property_id as type,
        property_value_current_value as valeur,
        property_value_revised_value,
        property_value_comment,
        property_value_last_update as date_de_mise_a_jour,
        snapshot_date

        from source

)

select * from renamed