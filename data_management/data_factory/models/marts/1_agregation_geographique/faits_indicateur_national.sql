WITH faits_indicateur__national_user_input as (
    SELECT
        fi_deduplique.indicateur_id,
        fi_deduplique.zone_id,
        fi_deduplique.mois_releve,
        fi_deduplique.type_mesure,
        fi_deduplique.valeur,
        fi_deduplique.zone_code,
        fi_deduplique.zone_type
    FROM {{ ref("faits_indicateur_deduplique") }} fi_deduplique
    LEFT JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_deduplique.indicateur_id = parametrage_indicateurs.indicateur_id
    WHERE (zone_type = 'NAT' AND (parametrage_indicateurs.vi_nat_from = 'user_input' AND fi_deduplique.type_mesure = 'vi'))
        OR (zone_type = 'NAT' AND (parametrage_indicateurs.va_nat_from = 'user_input' AND fi_deduplique.type_mesure = 'va'))
        OR (zone_type = 'NAT' AND (parametrage_indicateurs.vc_nat_from = 'user_input' AND fi_deduplique.type_mesure = 'vc'))
)

SELECT
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent as zone_id,
    fi_reg.mois_releve,
    fi_reg.type_mesure,
    CASE
        WHEN MAX(parametrage_indicateurs.vi_nat_op) = 'sum' THEN SUM(fi_reg.valeur)
        WHEN MAX(parametrage_indicateurs.vi_nat_op) = 'avg' THEN AVG(fi_reg.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_reg.zone_code_parent) as zone_code,
    MAX(fi_reg.zone_type_parent) as zone_type
FROM
    {{ ref("faits_indicateur_regional") }} fi_reg
    INNER JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_reg.indicateur_id = parametrage_indicateurs.indicateur_id
WHERE parametrage_indicateurs.vi_nat_from='REG'
    OR parametrage_indicateurs.va_nat_from='REG'
    OR parametrage_indicateurs.vc_nat_from='REG'
GROUP BY
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent,
    fi_reg.mois_releve,
    fi_reg.type_mesure
UNION
SELECT
    fi_dept.indicateur_id,
    'FRANCE' as zone_id,
    fi_dept.mois_releve,
    fi_dept.type_mesure,
    CASE
        WHEN MAX(parametrage_indicateurs.vi_nat_op) = 'sum' THEN SUM(fi_dept.valeur)
        WHEN MAX(parametrage_indicateurs.vi_nat_op) = 'avg' THEN AVG(fi_dept.valeur)
        ELSE NULL
    END AS valeur,
    'FR' as zone_code,
    'NAT' as zone_type
FROM
    {{ ref("faits_indicateur_departemental") }} fi_dept
    INNER JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_dept.indicateur_id = parametrage_indicateurs.indicateur_id
WHERE parametrage_indicateurs.vi_nat_from='DEPT'
    OR parametrage_indicateurs.va_nat_from='DEPT'
    OR parametrage_indicateurs.vc_nat_from='DEPT'
GROUP BY
    fi_dept.indicateur_id,
    fi_dept.mois_releve,
    fi_dept.type_mesure
UNION
SELECT *
FROM faits_indicateur__national_user_input
