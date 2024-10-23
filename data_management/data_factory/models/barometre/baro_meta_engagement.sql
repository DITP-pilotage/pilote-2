SELECT 
engagement_id, engagement_short, engagement_name
FROM {{ ref('stg_ppg_metadata__engagement') }} 
