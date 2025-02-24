-- Sélection des valeurs et calculs des aggrégation pour le niveau REG
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation REG
mesure_last_params_reg AS (
    SELECT
        a.id,
        a.date_import,
        a.indic_id,
        metric_date,
        metric_type,
        metric_value,
        zone_id,
        b.vi_reg_from,
        b.vi_reg_op,
        b.va_reg_from,
        b.va_reg_op,
        b.vc_reg_from,
        b.vc_reg_op
    FROM "qualif_249"."df3"."mesure_last_null_erase_keep_lastvalmonth" AS a
    LEFT JOIN
        "qualif_249"."raw_data"."metadata_parametrage_indicateurs" AS b
        ON a.indic_id = b.indic_id
),

-- Valeurs REG saisies directement par l'utilisateur
mesure_last_params_reg_user AS (
    SELECT
        a.*,
        b.maille AS zone_type
    FROM mesure_last_params_reg AS a
    LEFT JOIN "qualif_249"."raw_data"."stg_ppg_metadata__zones" AS b ON a.zone_id = b.id
    WHERE
        (
            (metric_type = 'vi' AND vi_reg_from = 'user_input')
            OR (metric_type = 'va' AND va_reg_from = 'user_input')
            OR (metric_type = 'vc' AND vc_reg_from = 'user_input')
        )
        AND b.maille = 'REG'
),


-- Liste des indicateurs qui ont un paramétrage d'aggrégation pour les valeurs REG
indic_agg_from_dept AS (
    SELECT
        b.indic_id,
        b.vi_reg_from,
        b.vi_reg_op,
        b.va_reg_from,
        b.va_reg_op,
        b.vc_reg_from,
        b.vc_reg_op
    FROM
        "qualif_249"."raw_data"."metadata_parametrage_indicateurs" AS b
    WHERE
        b.vi_reg_from NOT IN ('_', 'user_input')
        OR b.va_reg_from NOT IN ('_', 'user_input')
        OR b.vc_reg_from NOT IN ('_', 'user_input')

),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent REG
-- Ce sont ces données que la DF va aggréger
mesure_last_params_reg_from_dept AS (
    SELECT
        a.id,
        a.date_import,
        a.indic_id AS indic_id1,
        metric_date,
        metric_type,
        metric_value::float,
        a.zone_id,
        b.zone_type,
        b.zone_parent,
        b.zone_parent_type,
        c.*
    FROM "qualif_249"."df3"."mesure_last_null_erase_keep_lastvalmonth" AS a
    INNER JOIN "qualif_249"."df3"."zone_parent" AS b ON a.zone_id = b.zone_id
    RIGHT JOIN indic_agg_from_dept AS c ON a.indic_id = c.indic_id
    WHERE
        -- uniquement des données REG avec parent NAT
        zone_type = 'DEPT' AND zone_parent_type = 'REG'
        -- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
        AND (
            (metric_type = 'vi' AND vi_reg_from = 'DEPT')
            OR (metric_type = 'va' AND va_reg_from = 'DEPT')
            OR (metric_type = 'vc' AND vc_reg_from = 'DEPT')
        )
)



,

-- Ici on calcule une aggrégation en somme ET en moyenne des DEPT vers REG
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg AS (
    SELECT
        -- On met id=NULL lorsque la valeur est générée par aggrégation et non issue d'une mesure saisie
        null::uuid AS id,
        max(date_import) AS date_import,
        zone_parent,
        indic_id AS indic_id1,
        metric_date,
        metric_type,
        sum(metric_value::float) AS op_sum,
        avg(metric_value::float) AS op_avg,
        count(zone_id) as n_zone_prises_en_compte,
        array_agg(zone_id) as zones
    FROM mesure_last_params_reg_from_dept
    -- TODO: explo
    where 
    --indic_id='IND-895' and
metric_type='va'
and zone_type='DEPT' and zone_parent_type='REG'
and vi_reg_from='DEPT'
    GROUP BY zone_parent, indic_id, metric_date, metric_type
)

--select * from compute_op_sum_avg 


-- On sélectionne le bon résultat de calcul de l'aggrégation 
, compute_op_selected AS (
    SELECT
        b.*,
        a.*,
        CASE
            WHEN metric_type = 'vi' AND vi_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'vi' AND vi_reg_op = 'avg' THEN op_avg
            WHEN metric_type = 'va' AND va_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'va' AND va_reg_op = 'avg' THEN op_avg
            WHEN metric_type = 'vc' AND vc_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'vc' AND vc_reg_op = 'avg' THEN op_avg
            -- Si opération non supportée, ie hors de [sum, avg]
            ELSE -1.212121
        END AS op_selected
    FROM indic_agg_from_dept AS a
    RIGHT JOIN compute_op_sum_avg AS b ON a.indic_id = b.indic_id1
)

,

-- On sélectionne qq colonne puis tri
mesure_last_params_reg_aggregated AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_parent AS zone_id,
        metric_date,
        metric_type,
        op_selected AS metric_value,
        n_zone_prises_en_compte,
        zones,
        rank()
            OVER (PARTITION BY indic_id, zone_parent ORDER BY date_import DESC, metric_date ASC, random())
        AS r
    FROM compute_op_selected
    order by indic_id, zone_parent, date_import DESC, metric_date ASC
),

mesure_last_params_reg_aggregated_rank1 as (
    select 
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        metric_value,
        zones as zones_rank_1
    from mesure_last_params_reg_aggregated
    WHERE r=1
),

mesure_last_params_reg_aggregated_rankn as (
    select 
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        metric_value,
        r as rrank,
        zones as zones_rank_n
    from mesure_last_params_reg_aggregated
    WHERE r>1
)
, compare_rank1_vs_rankn as (
select 
    a.indic_id,
    a.zone_id,
    a.metric_date,
    a.metric_type,
    a.metric_value,
    a.zones_rank_1,
    b.metric_date as date_rankn,
    b.metric_value as value_rankn,
    b.zones_rank_n,
    b.rrank as rank_n,
    a.zones_rank_1 @> b.zones_rank_n as rank1_contains_rankn

from mesure_last_params_reg_aggregated_rank1 a
right join mesure_last_params_reg_aggregated_rankn b on 
a.indic_id=b.indic_id and a.zone_id=b.zone_id
and a.metric_type=b.metric_type
)

, keep_diffs as (
    select * from compare_rank1_vs_rankn
    WHERE not rank1_contains_rankn
)

select 
    b.indic_parent_ch as chantier_id, 
    a.indic_id,
    a.zone_id,
    t.nom as zone_nom,
    a.metric_date,
    a.metric_type,
    a.metric_value,
    a.zones_rank_1,
    a.date_rankn,
    a.value_rankn,
    a.zones_rank_n,
    a.rank_n,
    a.rank1_contains_rankn
from keep_diffs a
left join raw_data.metadata_indicateurs b on a.indic_id=b.indic_id 
left join public.territoire t on t.zone_id =a.zone_id
order by b.indic_parent_ch, a.indic_id, a.zone_id
