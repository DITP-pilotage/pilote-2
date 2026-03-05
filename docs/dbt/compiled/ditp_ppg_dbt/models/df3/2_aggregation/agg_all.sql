

-- Union de toutes les tables d'aggrégation (DEPT, REG, NAT)
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM "dev_pilote__6230"."df3"."agg_dept"
UNION ALL
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM "dev_pilote__6230"."df3"."agg_reg"
UNION ALL
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM "dev_pilote__6230"."df3"."agg_nat_rule544"
--order by indic_id, zone_id, metric_date