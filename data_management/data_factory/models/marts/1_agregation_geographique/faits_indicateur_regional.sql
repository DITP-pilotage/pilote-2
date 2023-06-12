WITH faits_indicateur__regions_user_input as (
    SELECT -- premier select : les vi avec user input
        fi_deduplique.indicateur_id,
        fi_deduplique.zone_id,
        fi_deduplique.mois_releve,
        fi_deduplique.type_mesure,
        fi_deduplique.valeur,
        fi_deduplique.zone_code,
        fi_deduplique.zone_type,
        fi_deduplique.zone_id_parent,
        fi_deduplique.zone_code_parent,
        fi_deduplique.zone_type_parent
    FROM {{ ref("faits_indicateur_deduplique") }} fi_deduplique
    LEFT JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_deduplique.indicateur_id = parametrage_indicateurs.indicateur_id
    WHERE (zone_type = 'REG' AND (parametrage_indicateurs.vi_reg_from = 'user_input' AND fi_deduplique.type_mesure = 'vi'))
        OR (zone_type = 'REG' AND (parametrage_indicateurs.va_reg_from = 'user_input' AND fi_deduplique.type_mesure = 'va'))
        OR (zone_type = 'REG' AND (parametrage_indicateurs.vc_reg_from = 'user_input' AND fi_deduplique.type_mesure = 'vc'))
)

SELECT
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent as zone_id,
    fi_dept.mois_releve,
    fi_dept.type_mesure,
    CASE
        WHEN MAX(parametrage_indicateurs.vi_reg_op) = 'sum' THEN SUM(fi_dept.valeur)
        WHEN MAX(parametrage_indicateurs.vi_reg_op) = 'avg' THEN AVG(fi_dept.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_dept.zone_code_parent) as zone_code,
    MAX(fi_dept.zone_type_parent) as zone_type,
    'FRANCE' as zone_id_parent,
    'FR' as zone_code_parent,
    'NAT' as zone_type_parent
FROM
    {{ ref("faits_indicateur_departemental") }} fi_dept
    INNER JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_dept.indicateur_id = parametrage_indicateurs.indicateur_id
WHERE parametrage_indicateurs.vi_reg_from='DEPT'
    OR parametrage_indicateurs.va_reg_from='DEPT'
    OR parametrage_indicateurs.vc_reg_from='DEPT'
GROUP BY
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent,
    fi_dept.mois_releve,
    fi_dept.type_mesure
UNION
SELECT *
from faits_indicateur__regions_user_input
