-- Ajoute à metadata_indicateur ses zones applicables

SELECT a.*, b.child_zone_id_agg FROM {{ ref('metadata_indicateurs') }} a 
LEFT JOIN {{ ref('zonegroup_agg') }} b 
ON a.zg_applicable=b.zone_group_id 