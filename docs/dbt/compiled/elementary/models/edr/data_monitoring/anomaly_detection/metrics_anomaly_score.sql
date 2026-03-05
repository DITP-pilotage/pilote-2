

with data_monitoring_metrics as (

    select * from "dev_pilote__6230"."elementary"."data_monitoring_metrics"

),

time_window_aggregation as (

    select
        id,
        full_table_name,
        column_name,
        dimension,
        dimension_value,
        metric_name,
        metric_value,
        source_value,
        bucket_start,
        bucket_end,
        bucket_duration_hours,
        updated_at,
        avg(metric_value) over (partition by metric_name, full_table_name, column_name order by bucket_start asc rows between unbounded preceding and current row) as training_avg,
        stddev(cast(metric_value as float)) over (partition by metric_name, full_table_name, column_name order by bucket_start asc rows between unbounded preceding and current row) as training_stddev,
        count(metric_value) over (partition by metric_name, full_table_name, column_name order by bucket_start asc rows between unbounded preceding and current row) as training_set_size,
        last_value(bucket_end) over (partition by metric_name, full_table_name, column_name order by bucket_start asc rows between unbounded preceding and current row) training_end,
        first_value(bucket_end) over (partition by metric_name, full_table_name, column_name order by bucket_start asc rows between unbounded preceding and current row) as training_start
    from data_monitoring_metrics
    group by 1,2,3,4,5,6,7,8,9,10,11,12
),

metrics_anomaly_score as (

    select
        id,
        full_table_name,
        column_name,
        dimension,
        dimension_value,
        metric_name,
        case
            when training_stddev is null then null
            when training_set_size = 1 then null  -- Single value case - no historical context for anomaly detection
            when training_stddev = 0 then 0  -- Stationary data case - valid, all values are identical
            else (metric_value - training_avg) / (training_stddev)
        end as anomaly_score,
        metric_value as latest_metric_value,
        bucket_start,
        bucket_end,
        training_avg,
        training_stddev,
        training_start,
        training_end,
        training_set_size,
        max(updated_at) as updated_at
    from time_window_aggregation
        where
            metric_value is not null
            and training_avg is not null
            and bucket_end >= 
    cast(date_trunc('day', 
    current_timestamp::timestamp
) as timestamp) + cast(-7 as integer) * INTERVAL '1 day'

    group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
    order by bucket_end desc


),

final as (

    select
        id,
        full_table_name,
        column_name,
        dimension,
        dimension_value,
        metric_name,
        anomaly_score,
        latest_metric_value,
        bucket_start,
        bucket_end,
        training_avg,
        training_stddev,
        training_start,
        training_end,
        training_set_size,
        updated_at,
        case
            when abs(anomaly_score) > 3 then true
            else false end
        as is_anomaly
    from metrics_anomaly_score
)

select * from final