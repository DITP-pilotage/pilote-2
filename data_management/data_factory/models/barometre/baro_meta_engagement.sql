SELECT 
engagement_id, engagement_short, engagement_name
FROM {{ source('dlt_load', 'metadata_engagement') }} 
