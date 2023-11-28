{{ config(
    enabled=true,
    tags=["data_quality", "scope_indicateur"],
    severity = "error",
    store_failures = false
) }}

-- Pour chaque rapport global ({indic}), on compte le nombre de rapport de zone ({indic-zone})
--	La logique veut que:
--	- C1: lorsqu'on a un rapport global, on a NECESSAIREMENT au moins un rapport de zone
--	- C2: lorsque l'on a pas de rapport global, on a NECESSAIREMENT AUCUN rapport de zone
with cnt_rapport_zone_when_rapport_global as (
	select id, dernier_import_rapport_id_indic, count(dernier_import_rapport_id) as nb_rapp_indic_zone 
    from {{ ref('indicateur') }} group by id, dernier_import_rapport_id_indic)

select * from cnt_rapport_zone_when_rapport_global where
	-- C1	
	(dernier_import_rapport_id_indic is not null and nb_rapp_indic_zone<1) or
	-- C2
	(dernier_import_rapport_id_indic is null and nb_rapp_indic_zone>0)