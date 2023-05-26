WITH faits_indicateur__national as (
    SELECT
        indicateur_id,
        zone_id,
        mois_releve,
        type_mesure,
        valeur,
        zone_code,
        zone_type
    FROM {{ ref("faits_indicateur_deduplique") }}
    WHERE zone_type = 'NAT'
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
WHERE fi_reg.indicateur_id NOT IN (SELECT indicateur_id FROM faits_indicateur__national) -- condition temporaire en attendant le paramétrage
GROUP BY
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent,
    fi_reg.mois_releve,
    fi_reg.type_mesure
UNION
SELECT *
FROM faits_indicateur__national
