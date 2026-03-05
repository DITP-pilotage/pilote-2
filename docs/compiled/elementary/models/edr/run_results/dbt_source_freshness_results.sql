


    select * from (
            select
            
                
        cast('dummy_string' as varchar(4096)) as source_freshness_execution_id

,
                
        cast('dummy_string' as varchar(4096)) as unique_id

,
                
        cast('dummy_string' as varchar(4096)) as max_loaded_at

,
                
        cast('dummy_string' as varchar(4096)) as snapshotted_at

,
                
        cast('dummy_string' as varchar(4096)) as generated_at

,
                cast('2091-02-17' as timestamp) as created_at

,
                
        cast(123456789.99 as float) as max_loaded_at_time_ago_in_s

,
                
        cast('dummy_string' as varchar(4096)) as status

,
                
        cast('dummy_string' as varchar(4096)) as error

,
                
        cast('dummy_string' as varchar(4096)) as compile_started_at

,
                
        cast('dummy_string' as varchar(4096)) as compile_completed_at

,
                
        cast('dummy_string' as varchar(4096)) as execute_started_at

,
                
        cast('dummy_string' as varchar(4096)) as execute_completed_at

,
                
        cast('dummy_string' as varchar(4096)) as invocation_id

,
                
        cast('dummy_string' as varchar(4096)) as warn_after

,
                
        cast('dummy_string' as varchar(4096)) as error_after

,
                
        cast('this_is_just_a_long_dummy_string' as text) as filter


        ) as empty_table
        where 1 = 0
