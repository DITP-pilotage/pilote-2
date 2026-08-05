SELECT
    engagement_id,
    engagement_short,
    engagement_name
FROM {{ source('ppg_metadata', 'metadata_engagement') }}
