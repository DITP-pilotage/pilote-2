






with jjoin as (select 
    coalesce(a.id, b.id) as id, 
    coalesce(a.territoire_code, b.territoire_code) as territoire_code,
    a.valeur_actuelle as computed_value,
    b.valeur_actuelle as target_value,
    case
		when a.valeur_actuelle=0 then null
		when b.valeur_actuelle=0 then null
		else abs(a.valeur_actuelle-b.valeur_actuelle)/b.valeur_actuelle
	end as ratio

    from "postgres"."public"."df3_indicateur" a
    full join  "postgres"."public"."indicateur" b
    on a.territoire_code=b.territoire_code and a.id=b.id
), date_same as (
select 
    coalesce(a.id, b.id) as id, 
    coalesce(a.territoire_code, b.territoire_code) as territoire_code,
    case
		when a.date_valeur_actuelle is null and b.date_valeur_actuelle is not null then false
		when b.date_valeur_actuelle is null and a.date_valeur_actuelle is not null then false
		when a.date_valeur_actuelle is null and b.date_valeur_actuelle is null then true
		when date_trunc('month', a.date_valeur_actuelle::date) = date_trunc('month', b.date_valeur_actuelle) then true
		else false
	end as is_month_va_same
    ,a.date_valeur_actuelle as date_computed_value, b.date_valeur_actuelle as date_target_value

    from "postgres"."public"."df3_indicateur" a
    full join  "postgres"."public"."indicateur" b
    on a.territoire_code=b.territoire_code and a.id=b.id
)

select a.*, b.is_month_va_same, b.date_computed_value, b.date_target_value from jjoin a
left join date_same b
on a.territoire_code=b.territoire_code and a.id=b.id
where 
	(computed_value is not null and target_value is not null)
    AND (computed_value <> target_value)
    AND (ratio is null or ratio > 0)
    and is_month_va_same

