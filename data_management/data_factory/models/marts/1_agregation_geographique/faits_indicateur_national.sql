WITH faits_indicateur__national as (
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
    WHERE zone_type = 'NAT'
        AND parametrage_indicateurs.vi_nat_from='user_input'
)

SELECT
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent as zone_id,
    fi_reg.mois_releve,
    fi_reg.type_mesure,
    CASE
        WHEN MAX(parametrage_indicateurs.vacg_operation) = 'sum' THEN SUM(fi_reg.valeur)
        WHEN MAX(parametrage_indicateurs.vacg_operation) = 'avg' THEN AVG(fi_reg.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_reg.zone_code_parent) as zone_code,
    MAX(fi_reg.zone_type_parent) as zone_type
FROM
    {{ ref("faits_indicateur_regional") }} fi_reg
    INNER JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_reg.indicateur_id = parametrage_indicateurs.indicateur_id
WHERE parametrage_indicateurs.vi_nat_from='REG' -- on considère que c'est la même agrégation pour vi, va, vc
GROUP BY
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent,
    fi_reg.mois_releve,
    fi_reg.type_mesure
UNION
SELECT
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent as zone_id,
    fi_dept.mois_releve,
    fi_dept.type_mesure,
    CASE
        WHEN MAX(parametrage_indicateurs.vacg_operation) = 'sum' THEN SUM(fi_dept.valeur)
        WHEN MAX(parametrage_indicateurs.vacg_operation) = 'avg' THEN AVG(fi_dept.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_dept.zone_code_parent) as zone_code,
    MAX(fi_dept.zone_type_parent) as zone_type
FROM
    {{ ref("faits_indicateur_departemental") }} fi_dept
    INNER JOIN {{ ref("stg_ppg_metadata__parametrage_indicateurs") }} parametrage_indicateurs
        ON fi_dept.indicateur_id = parametrage_indicateurs.indicateur_id
WHERE parametrage_indicateurs.vi_nat_from='DEPT' -- on considère que c'est la même agrégation pour vi, va, vc
GROUP BY
    fi_dept.indicateur_id,
    fi_dept.zone_id_parent,
    fi_dept.mois_releve,
    fi_dept.type_mesure
UNION
SELECT *
FROM faits_indicateur__national
