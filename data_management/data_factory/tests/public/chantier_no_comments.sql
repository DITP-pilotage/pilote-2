
--select tree_node_id from {{ref('dim_tree_nodes')}} where tree_node_id = '2210412fb0db40a19f8b2cf8d39ea4e2'

-- Comppte le nb de chantiers qui n'ont pas de commentaires du tout
with
types_comm as (select chantier_id , "type", count(*) from public.commentaire c group by chantier_id , "type" order by chantier_id),
all_ch as (select id as chantier_id from chantier group by id),
cnt_distinct_comm_types as (
	select chantier_id, count(*) as nb_distinct_coms_types from types_comm group by chantier_id)

select b.chantier_id, a.nb_distinct_coms_types
from cnt_distinct_comm_types a right join
all_ch b on a.chantier_id=b.chantier_id
where nb_distinct_coms_types is null