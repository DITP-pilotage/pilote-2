


    select * from (
            select
            
                
        cast('dummy_string' as varchar(4096)) as column_state_id

,
                
        cast('dummy_string' as varchar(4096)) as full_column_name

,
                
        cast('dummy_string' as varchar(4096)) as full_table_name

,
                
        cast('dummy_string' as varchar(4096)) as column_name

,
                
        cast('dummy_string' as varchar(4096)) as data_type

,
                
        cast (True as boolean) as is_new

,
                cast('2091-02-17' as timestamp) as detected_at

,
                cast('2091-02-17' as timestamp) as created_at


        ) as empty_table
        where 1 = 0
