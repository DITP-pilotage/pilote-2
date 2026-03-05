

select * from (
            select
            
                
        cast('this_is_just_a_long_dummy_string' as text) as invocation_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as job_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as job_name

,
                
        cast('this_is_just_a_long_dummy_string' as text) as job_run_id

,
                
        cast('dummy_string' as varchar(4096)) as run_started_at

,
                
        cast('dummy_string' as varchar(4096)) as run_completed_at

,
                
        cast('dummy_string' as varchar(4096)) as generated_at

,
                cast('2091-02-17' as timestamp) as created_at

,
                
        cast('dummy_string' as varchar(4096)) as command

,
                
        cast('dummy_string' as varchar(4096)) as dbt_version

,
                
        cast('dummy_string' as varchar(4096)) as elementary_version

,
                
        cast (True as boolean) as full_refresh

,
                
        cast('this_is_just_a_long_dummy_string' as text) as invocation_vars

,
                
        cast('this_is_just_a_long_dummy_string' as text) as vars

,
                
        cast('dummy_string' as varchar(4096)) as target_name

,
                
        cast('dummy_string' as varchar(4096)) as target_database

,
                
        cast('dummy_string' as varchar(4096)) as target_schema

,
                
        cast('dummy_string' as varchar(4096)) as target_profile_name

,
                
        cast(123456789 as integer) as threads

,
                
        cast('this_is_just_a_long_dummy_string' as text) as selected

,
                
        cast('this_is_just_a_long_dummy_string' as text) as yaml_selector

,
                
        cast('dummy_string' as varchar(4096)) as project_id

,
                
        cast('dummy_string' as varchar(4096)) as project_name

,
                
        cast('dummy_string' as varchar(4096)) as env

,
                
        cast('dummy_string' as varchar(4096)) as env_id

,
                
        cast('dummy_string' as varchar(4096)) as cause_category

,
                
        cast('this_is_just_a_long_dummy_string' as text) as cause

,
                
        cast('dummy_string' as varchar(4096)) as pull_request_id

,
                
        cast('dummy_string' as varchar(4096)) as git_sha

,
                
        cast('dummy_string' as varchar(4096)) as orchestrator

,
                
        cast('dummy_string' as varchar(4096)) as dbt_user

,
                
        cast('dummy_string' as varchar(4096)) as job_url

,
                
        cast('dummy_string' as varchar(4096)) as job_run_url

,
                
        cast('dummy_string' as varchar(4096)) as account_id

,
                
        cast('this_is_just_a_long_dummy_string' as text) as target_adapter_specific_fields


        ) as empty_table
        where 1 = 0