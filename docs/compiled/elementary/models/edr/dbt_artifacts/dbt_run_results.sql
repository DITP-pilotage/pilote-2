

select * from (
            select
            
                
        cast('this_is_just_a_long_dummy_string' as text) as model_execution_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as unique_id

,
                
        cast('dummy_string' as varchar(4096)) as invocation_id

,
                
        cast('dummy_string' as varchar(4096)) as generated_at

,
                cast('2091-02-17' as timestamp) as created_at

,
                
        cast('this_is_just_a_long_dummy_string' as text) as name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as message

,
                
        cast('dummy_string' as varchar(4096)) as status

,
                
        cast('dummy_string' as varchar(4096)) as resource_type

,
                
        cast(123456789.99 as float) as execution_time

,
                
        cast('dummy_string' as varchar(4096)) as execute_started_at

,
                
        cast('dummy_string' as varchar(4096)) as execute_completed_at

,
                
        cast('dummy_string' as varchar(4096)) as compile_started_at

,
                
        cast('dummy_string' as varchar(4096)) as compile_completed_at

,
                
        cast(31474836478 as bigint) as rows_affected

,
                
        cast (True as boolean) as full_refresh

,
                
        cast('this_is_just_a_long_dummy_string' as text) as compiled_code

,
                
        cast(31474836478 as bigint) as failures

,
                
        cast('dummy_string' as varchar(4096)) as query_id

,
                
        cast('dummy_string' as varchar(4096)) as thread_id

,
                
        cast('dummy_string' as varchar(4096)) as materialization

,
                
        cast('dummy_string' as varchar(4096)) as adapter_response

,
                
        cast('dummy_string' as varchar(4096)) as group_name


        ) as empty_table
        where 1 = 0