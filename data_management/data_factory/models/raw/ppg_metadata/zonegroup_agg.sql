-- Pour chaque zone-group, retourne une seule ligne
--  avec "child_zone_id_agg" qui est un array contenant toutes les zones enfant

SELECT zone_group_id, array_agg(child_zone_id) AS child_zone_id_agg 
FROM {{ ref('zonegroup_unnest') }} 
GROUP BY zone_group_id ORDER BY zone_group_id