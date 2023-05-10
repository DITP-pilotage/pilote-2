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
        WHEN MAX(config_vac.operation) = 'sum' THEN SUM(fi_reg.valeur)
        WHEN MAX(config_vac.operation) = 'avg' THEN AVG(fi_reg.valeur)
        ELSE NULL
    END AS valeur,
    MAX(fi_reg.zone_code_parent) as zone_code,
    MAX(fi_reg.zone_type_parent) as zone_type
FROM
    {{ ref("faits_indicateur_par_regions") }} fi_reg
    INNER JOIN {{ ref("stg_ppg_metadata__config_vac") }} config_vac
        ON fi_reg.indicateur_id = config_vac.indicateur_id
GROUP BY
    fi_reg.indicateur_id,
    fi_reg.zone_id_parent,
    fi_reg.mois_releve,
    fi_reg.type_mesure
UNION
SELECT *
FROM faits_indicateur__national