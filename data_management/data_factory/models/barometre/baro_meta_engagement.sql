SELECT 
engagement_id, engagement_short, engagement_name
FROM {{ ref('metadata_engagement') }} 
