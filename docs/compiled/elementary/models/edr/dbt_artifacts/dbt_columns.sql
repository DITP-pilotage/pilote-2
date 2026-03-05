

select * from (
            select
            
                
        cast('dummy_string' as varchar(4096)) as unique_id

,
                
        cast('dummy_string' as varchar(4096)) as parent_unique_id

,
                
        cast('dummy_string' as varchar(4096)) as name

,
                
        cast('dummy_string' as varchar(4096)) as data_type

,
                
        cast('this_is_just_a_long_dummy_string' as text) as tags

,
                
        cast('this_is_just_a_long_dummy_string' as text) as meta

,
                
        cast('dummy_string' as varchar(4096)) as database_name

,
                
        cast('dummy_string' as varchar(4096)) as schema_name

,
                
        cast('dummy_string' as varchar(4096)) as table_name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as description

,
                
        cast('dummy_string' as varchar(4096)) as resource_type

,
                
        cast('dummy_string' as varchar(4096)) as generated_at

,
                
        cast('dummy_string' as varchar(4096)) as metadata_hash


        ) as empty_table
        where 1 = 0