with

source as (

    select * from {{ ref('dim_tree_nodes') }}

),

renamed as (

    select
        tree_node_id as id,
        tree_node_parent_id,
        structure_id,
        maturity_id,
        tree_node_name as nom,
        tree_node_code as code,
        SUBSTRING(tree_node_code, 1, 6) as code_chantier,
        CASE
            WHEN CHAR_LENGTH(tree_node_code) > 6 THEN SUBSTRING(tree_node_code, 8)
            ELSE 'NAT'
        END as zone_code,
        tree_node_status as status,
        tree_node_last_update_properties_date as last_update_properties_date,
        tree_node_last_update_scorecard_date as last_update_scorecard_date,
        tree_node_last_scorecard_update_by_anybody_date as last_scorecard_update_by_anybody_date,
        snapshot_date
    from source

)

select *
    from renamed
    where LOWER(code) not like '%temporaire%' and
          LOWER(code) not like '%test%'