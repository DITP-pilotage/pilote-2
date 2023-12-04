with compare as (select 
	a.id, a.territoire_code, a.taux_avancement as ta,
	b.taux_avancement as nouveau_ta
from df1_chantier a
left join df3_chantier b on a.id=b.id and a.territoire_code=b.territoire_code 
order by id, territoire_code),
compute_ratio as (
select *,
case 
	-- Both TA are null
	when coalesce(ta,nouveau_ta) is null then 0
	-- Only old_ta is null
	when (ta is null) or (nouveau_ta is null) then null
	when ta=0 and nouveau_ta=0 then 0
	when ta=0 and nouveau_ta<>0 then null
	when nouveau_ta-ta>=0 then (nouveau_ta-ta)/ta
	when nouveau_ta-ta<0 then (ta-nouveau_ta)/ta
	else 100000
end as ratio
from compare),
set_to_buckets as (


select *,
case 
	when ratio = 0 then '1. exact'
	when ratio < 0.01 then '2. approx'
	when ratio < 0.2 then '3. <20'
	when ratio > 1 then '5. >100'
	else '4. 20<x<100'
end as category


from compute_ratio)


--select category, count(*) from set_to_buckets group by category order by category



select * from set_to_buckets where category like '4. %' order by chantier_id, id, territoire_code