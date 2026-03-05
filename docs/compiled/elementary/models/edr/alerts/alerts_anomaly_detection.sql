

with elementary_test_results as (
    select * from "dev_pilote__6230"."elementary"."elementary_test_results"
),

alerts_anomaly_detection as (
    select id as alert_id,
           data_issue_id,
           test_execution_id,
           test_unique_id,
           model_unique_id,
           detected_at,
           database_name,
           schema_name,
           table_name,
           column_name,
           test_type as alert_type,
           test_sub_type as sub_type,
           test_results_description as alert_description,
           owners,
           tags,
           test_results_query as alert_results_query,
           other,
           test_name,
           test_short_name,
           test_params,
           severity,
           status,
           result_rows
        from elementary_test_results
        where True and lower(status) != 'pass'and lower(status) != 'skipped'and test_type = 'anomaly_detection'
)

select * from alerts_anomaly_detection