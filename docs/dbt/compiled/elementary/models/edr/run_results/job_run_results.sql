





with jobs as (
  select
    job_name,
    job_id,
    job_run_id,
    
min(cast(run_started_at as timestamp))
 as job_run_started_at,
    
max(cast(run_completed_at as timestamp))
 as job_run_completed_at,
    
    
        (
        (
        (
        ((
max(cast(run_completed_at as timestamp))
)::date - (
min(cast(run_started_at as timestamp))
)::date)
     * 24 + date_part('hour', (
max(cast(run_completed_at as timestamp))
)::timestamp) - date_part('hour', (
min(cast(run_started_at as timestamp))
)::timestamp))
     * 60 + date_part('minute', (
max(cast(run_completed_at as timestamp))
)::timestamp) - date_part('minute', (
min(cast(run_started_at as timestamp))
)::timestamp))
     * 60 + floor(date_part('second', (
max(cast(run_completed_at as timestamp))
)::timestamp)) - floor(date_part('second', (
min(cast(run_started_at as timestamp))
)::timestamp)))
    
 as job_run_execution_time
  from "dev_pilote__6230"."elementary"."dbt_invocations"
  where job_id is not null
  group by job_name, job_id, job_run_id
)

select
  job_name as name,
  job_id as id,
  job_run_id as run_id,
  job_run_started_at as run_started_at,
  job_run_completed_at as run_completed_at,
  job_run_execution_time as run_execution_time
from jobs