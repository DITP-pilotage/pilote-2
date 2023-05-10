SELECT *
FROM {{ ref("faits_indicateur_deduplique") }}
WHERE zone_type = 'DEPT'
