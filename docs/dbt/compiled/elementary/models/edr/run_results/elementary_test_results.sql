


    select * from (
            select
            
                
        cast('this_is_just_a_long_dummy_string' as text) as id

,
                
        cast('dummy_string' as varchar(4096)) as data_issue_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_execution_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_unique_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as model_unique_id

,
                
        cast('dummy_string' as varchar(4096)) as invocation_id

,
                cast('2091-02-17' as timestamp) as detected_at

,
                cast('2091-02-17' as timestamp) as created_at

,
                
        cast('dummy_string' as varchar(4096)) as database_name

,
                
        cast('dummy_string' as varchar(4096)) as schema_name

,
                
        cast('dummy_string' as varchar(4096)) as table_name

,
                
        cast('dummy_string' as varchar(4096)) as column_name

,
                
        cast('dummy_string' as varchar(4096)) as test_type

,
                
        cast('dummy_string' as varchar(4096)) as test_sub_type

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_results_description

,
                
        cast('dummy_string' as varchar(4096)) as owners

,
                
        cast('dummy_string' as varchar(4096)) as tags

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_results_query

,
                
        cast('dummy_string' as varchar(4096)) as other

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as test_params

,
                
        cast('dummy_string' as varchar(4096)) as severity

,
                
        cast('dummy_string' as varchar(4096)) as status

,
                
        cast(31474836478 as bigint) as failures

,
                
        cast('dummy_string' as varchar(4096)) as test_short_name

,
                
        cast('dummy_string' as varchar(4096)) as test_alias

,
                
        cast('this_is_just_a_long_dummy_string' as text) as result_rows

,
                
        cast(31474836478 as bigint) as failed_row_count


        ) as empty_table
        where 1 = 0
