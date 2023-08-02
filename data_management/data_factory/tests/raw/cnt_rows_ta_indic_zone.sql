-- Nombre de lignes de TA pour chaque indicateur à chaque zone
-- On vérifie qu'il n'y en a qu'une
-- (test de démo, pas utile)

with nb_ta_indic as (
select a.effect_id , b.tree_node_code, count(*) as cnt
from raw_data.stg_dfakto__fact_progress_indicateurs a left join
raw_data.dim_tree_nodes b on a.tree_node_id = b.tree_node_id
group by a.effect_id , b.tree_node_code)



select *  from nb_ta_indic where cnt >1