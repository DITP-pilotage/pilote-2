

select * from (
            select
            
                
        cast('dummy_string' as varchar(4096)) as unique_id

,
                
        cast('dummy_string' as varchar(4096)) as name

,
                
        cast('dummy_string' as varchar(4096)) as maturity

,
                
        cast('dummy_string' as varchar(4096)) as type

,
                
        cast('dummy_string' as varchar(4096)) as owner_email

,
                
        cast('dummy_string' as varchar(4096)) as owner_name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as url

,
                
        cast('this_is_just_a_long_dummy_string' as text) as depends_on_macros

,
                
        cast('this_is_just_a_long_dummy_string' as text) as depends_on_nodes

,
                
        cast('this_is_just_a_long_dummy_string' as text) as depends_on_columns

,
                
        cast('this_is_just_a_long_dummy_string' as text) as description

,
                
        cast('this_is_just_a_long_dummy_string' as text) as tags

,
                
        cast('this_is_just_a_long_dummy_string' as text) as meta

,
                
        cast('dummy_string' as varchar(4096)) as package_name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as original_path

,
                
        cast('dummy_string' as varchar(4096)) as path

,
                
        cast('dummy_string' as varchar(4096)) as generated_at

,
                
        cast('dummy_string' as varchar(4096)) as metadata_hash

,
                
        cast('dummy_string' as varchar(4096)) as label

,
                
        cast('this_is_just_a_long_dummy_string' as text) as raw_queries


        ) as empty_table
        where 1 = 0