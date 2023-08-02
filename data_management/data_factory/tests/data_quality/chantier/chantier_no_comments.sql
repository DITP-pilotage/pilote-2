{{ config(
    enabled=true,
    tags="data_quality",
    severity = "warn",
    store_failures = true,
    limit = 100,
) }}

-- Comppte le nb de chantiers qui n'ont pas de commentaires du tout
with
types_comm as (select chantier_id , "type", count(*) from {{ref('commentaire')}} c group by chantier_id , "type" order by chantier_id),
all_ch as (select id as chantier_id from {{ref('chantier')}} group by id),
cnt_distinct_comm_types as (
	select chantier_id, count(*) as nb_distinct_coms_types from types_comm group by chantier_id)

select b.chantier_id, a.nb_distinct_coms_types
from cnt_distinct_comm_types a right join
all_ch b on a.chantier_id=b.chantier_id
where nb_distinct_coms_types is null