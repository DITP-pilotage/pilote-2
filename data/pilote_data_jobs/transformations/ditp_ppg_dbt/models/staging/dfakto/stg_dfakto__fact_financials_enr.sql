with

source as (

    select * from {{ ref('fact_financials_enr') }}

),

    -- Il reste du renommage à faire
renamed as (

    select tree_node_id,
        period_id,
        state_id as type_valeur,
        effect_id,
        financials_decumulated_amount as valeur

    from source

)

select * from renamed