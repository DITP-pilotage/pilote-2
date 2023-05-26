WITH faits_indicateur_order_by_date as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_trunc('month', date_releve) ORDER BY date_releve DESC, date_import DESC) AS row_id_by_date_releve_desc,
        *
    FROM {{ ref("faits_indicateur") }}
    WHERE (faits_indicateur.zone_type_parent <> 'ACAD' OR faits_indicateur.zone_type_parent IS NULL)
        --AND NOT (date_trunc('year', date_releve) > CURRENT_DATE AND type_mesure = 'va') -- a decommenter ou non selon réponse à la question 2 du mail ROFA 22 Mai
    ORDER BY indicateur_id, zone_id, type_mesure, date_trunc('month', date_releve), row_id_by_date_releve_desc -- pour les tests à supprimer
),

faits_indicateur_group_by_indicateur_et_zone_order_by_date as (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY indicateur_id, zone_id
            ORDER BY (case when type_mesure = 'vi' then 0 else 1 END) ASC, date_releve ASC, date_import DESC
        ) AS row_id_par_indicateur_et_zone,
        *
    FROM faits_indicateur_order_by_date
    WHERE row_id_by_date_releve_desc = 1
)

SELECT
    indicateur_id,
    zone_id,
    date_releve,
    date_trunc('month', date_releve) as mois_releve,
    CASE WHEN type_mesure = 'va' and row_id_par_indicateur_et_zone = 1
        THEN 'vi'
        ELSE type_mesure
    end as type_mesure,
    valeur,
    zone_code,
    zone_type,
    zone_id_parent,
    zone_code_parent,
    zone_type_parent
FROM faits_indicateur_group_by_indicateur_et_zone_order_by_date
