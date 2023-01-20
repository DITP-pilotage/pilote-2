with

source as (

    select * from {{ source('dfakto', 'dim_tree_nodes') }}

),

renamed as (

    select
        tree_node_id as id,
        tree_node_parent_id,
        structure_id,
        maturity_id,
        tree_node_name as nom,
        tree_node_code as code,
        case
            when split_part(tree_node_code, '-', 1) = 'OVQ' then 'FRANCE'
            else split_part(tree_node_code, '-', 2)
        end as code_region,
        case
            when split_part(tree_node_code, '-', 1) = 'OVQ' then split_part(tree_node_code, '-', 2)
            else split_part(tree_node_code, '-', 1)
        end as code_chantier,
        tree_node_status as status,
        tree_node_last_synchronization_date as last_synchronization_date,
        tree_node_last_update_properties_date as last_update_properties_date,
        tree_node_last_update_scorecard_date as last_update_scorecard_date,
        tree_node_last_scorecard_update_by_anybody_date as last_scorecard_update_by_anybody_date,
        tree_node_last_update_children_date as last_update_children_date,
        tree_node_currency as currency,
        snapshot_date
    from source

)

select * from renamed