WITH
-- la pondération définie par le paramétrage
-- sans prendre en compte les zones applicables
-- poids selon la pondération déclarée dans le DF
poids_declare AS (
    SELECT
        parametrage_indicateurs.indic_id,
        territoires.zone_id,
        CASE
            WHEN
                zones.maille = 'DEPT'
                THEN parametrage_indicateurs.poids_pourcent_dept_declaree
            WHEN
                zones.maille = 'REG'
                THEN parametrage_indicateurs.poids_pourcent_reg_declaree
            WHEN
                zones.maille = 'NAT'
                THEN parametrage_indicateurs.poids_pourcent_nat_declaree
        END AS poids_zone_declaree,
        CASE
            WHEN
                zones.maille = 'DEPT'
                THEN parametrage_indicateurs.poids_pourcent_eval_dept_declaree
            WHEN
                zones.maille = 'REG'
                THEN parametrage_indicateurs.poids_pourcent_eval_reg_declaree
            WHEN
                zones.maille = 'NAT'
                THEN parametrage_indicateurs.poids_pourcent_eval_nat_declaree
        END AS poids_eval_zone_declaree,
        indic.chantier_id,
        territoires.maille AS zone_type
    FROM
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS parametrage_indicateurs
    CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS territoires
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS zones
        ON territoires.zone_id = zones.id
    LEFT JOIN
        {{ ref('stg_ppg_metadata__indicateurs') }} AS indic
        ON
            parametrage_indicateurs.indic_id = indic.id
            AND indic.est_cache_dans_pilote IS FALSE
),

-- poids selon la pond déclarée + zones applicables
poids_appl AS (
    SELECT
        COALESCE(indic_zones_applicables.est_applicable, TRUE)
            AS est_applicable,
        CASE
        -- si cet indic n'est pas explicitement signalé NON appl
        -- dans cette table, alors il est appl
            WHEN
                COALESCE(indic_zones_applicables.est_applicable, TRUE)
                THEN poids_declare.poids_zone_declaree
            -- si l'indic n'est pas applicable sur cette zone,
            -- alors la pondération est de 0
            ELSE 0
        END AS poids_zone_appl,
        CASE
            WHEN
                COALESCE(indic_zones_applicables.est_applicable, TRUE)
                THEN poids_declare.poids_eval_zone_declaree
            ELSE 0
        END AS poids_eval_zone_appl,
        poids_declare.*
    FROM poids_declare
    LEFT JOIN
        {{ ref('int_indicateurs_zones_applicables') }}
            AS indic_zones_applicables
        ON
            poids_declare.indic_id = indic_zones_applicables.indic_id
            AND poids_declare.zone_id = indic_zones_applicables.zone_id
),

total_poids_appl_ch AS (
    SELECT
        chantier_id,
        zone_id,
        -- Total des pondérations pour ce chantier et cette zone
        SUM(poids_zone_appl) AS total_poids_zone_appl_ch,
        SUM(poids_eval_zone_appl) AS total_poids_eval_zone_appl_ch
    FROM poids_appl
    GROUP BY chantier_id, zone_id
)

-- Calcul de la pondération réelle

SELECT
    CASE
        WHEN total_poids_appl_ch.total_poids_zone_appl_ch = 0
            THEN 0
        ELSE
            100.
            * poids_appl.poids_zone_appl
            / total_poids_appl_ch.total_poids_zone_appl_ch
    END AS poids_zone_reel,
    CASE
        WHEN total_poids_appl_ch.total_poids_eval_zone_appl_ch = 0
            THEN 0
        ELSE
            100.
            * poids_appl.poids_eval_zone_appl
            / total_poids_appl_ch.total_poids_eval_zone_appl_ch
    END AS poids_eval_zone_reel,
    total_poids_appl_ch.total_poids_zone_appl_ch,
    total_poids_appl_ch.total_poids_eval_zone_appl_ch,
    poids_appl.*
FROM poids_appl
LEFT JOIN total_poids_appl_ch
    ON
        poids_appl.chantier_id = total_poids_appl_ch.chantier_id
        AND poids_appl.zone_id = total_poids_appl_ch.zone_id

-- tests cas intéressants
--where poids_zone_reel>0 and poids_zone_reel<100
-- and poids_zone_reel<>poids_zone_declaree
--where total_poids_zone_appl_ch <100 and total_poids_zone_appl_ch>0 
-- and poids_zone_appl>0 and poids_zone_appl<>total_poids_zone_appl_ch
