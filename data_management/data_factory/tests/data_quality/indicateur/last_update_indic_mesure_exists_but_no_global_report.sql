{{ config(
    enabled=true,
    tags=["data_quality", "scope_indicateur"],
    severity = "error",
    store_failures = false
) }}

-- Retourne les indicateurs qui n'ont pas de dernier_import_rapport_id_indic (dernier rapport global)
--	MAIS pour lesquels il existe un import dans mesure_indicateur
-- Ce comportement serait anormal

WITH 
-- Pour chaque indicateur, compte le nombre de valeurs importées
nb_imports as (
	select indic_id, count(rapport_id) as n_imports from {{ source('import_from_files', 'mesure_indicateur') }} mi group by indic_id),
-- Pour chaque indicateur, retourne ceux qui semblent ne pas avoir de rapport global,
--	ie que aucune valeur n'ait jamais été importées (d'après les calculs de la table last_update_indic dans la table indicateur)
miss_import as (
	select id, true as missing_import_indic from {{ ref('indicateur') }} i  where dernier_import_rapport_id_indic is null group by id)


select * from miss_import a full join nb_imports b on a.id=b.indic_id 
-- Retourne les indicateurs qui n'ont pas de rapport global MAIS des imports faits
where missing_import_indic and n_imports>0


