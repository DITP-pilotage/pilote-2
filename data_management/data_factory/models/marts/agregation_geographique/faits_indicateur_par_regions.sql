WITH faits_indicateur__regions as (
    SELECT
        indicateur_id,
        zone_id,
        mois_releve,
        type_mesure,
        valeur,
        zone_code,
        zone_type,
        zone_id_parent,
        zone_code_parent,
        zone_type_parent
    FROM {{ ref("faits_indicateur_deduplique") }}
    WHERE zone_type = 'REG'
)

SELECT
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent as zone_id,
    fi_dept.mois_releve,
    fi_dept.type_mesure,
    CASE
        WHEN MAX(config_vac.operation) = 'sum' THEN SUM(fi_dept.valeur)
        WHEN MAX(config_vac.operation) = 'avg' THEN AVG(fi_dept.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_dept.zone_code_parent) as zone_code,
    MAX(fi_dept.zone_type_parent) as zone_type,
    'FRANCE' as zone_id_parent,
    'FR' as zone_code_parent,
    'NAT' as zone_type_parent
FROM
    {{ ref("faits_indicateur_par_departements") }} fi_dept
    INNER JOIN {{ ref("stg_ppg_metadata__config_vac") }} config_vac
        ON fi_dept.indicateur_id = config_vac.indicateur_id
GROUP BY
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent,
    fi_dept.mois_releve,
    fi_dept.type_mesure
UNION
SELECT *
from faits_indicateur__regions