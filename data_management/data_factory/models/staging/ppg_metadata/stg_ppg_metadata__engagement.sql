{{ config(materialized="table") }}

SELECT 
    engagement_id, 
    engagement_short, 
    engagement_name
FROM {{ source('python_load', 'metadata_engagement') }}
