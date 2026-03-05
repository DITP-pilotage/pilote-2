

-- Chaque axe a bien un ID et un nom non vide
select axe_id, axe_name from "dev_pilote__6230"."raw_data"."metadata_axes" 
WHERE 
    axe_id is NULL OR
    axe_name is NULL