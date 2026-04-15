WITH
-- la pondération définie par le paramétrage sans prendre en compte le zones applicables
-- poids selon la pondération déclarée dans le DF
get_poids_declaree AS (
    SELECT
        indic_id,
        t.zone_id,
        CASE
            WHEN z.maille = 'DEPT' THEN poids_pourcent_dept_declaree
            WHEN z.maille = 'REG' THEN poids_pourcent_reg_declaree
            WHEN z.maille = 'NAT' THEN poids_pourcent_nat_declaree
        END AS poids_zone_declaree,
        CASE
            WHEN z.maille = 'DEPT' THEN poids_pourcent_eval_dept_declaree
            WHEN z.maille = 'REG' THEN poids_pourcent_eval_reg_declaree
            WHEN z.maille = 'NAT' THEN poids_pourcent_eval_nat_declaree
        END AS poids_eval_zone_declaree,
        ind.chantier_id,
        t.maille AS zone_type
    FROM
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }}
    CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS t
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS z ON t.zone_id = z.id
    LEFT JOIN
        {{ ref('stg_ppg_metadata__indicateurs') }} AS ind
        ON ind.id = indic_id AND ind.est_cache_dans_pilote IS FALSE
    --where ind.chantier_id  ='CH-058'
    ORDER BY indic_id, t.zone_id
),

-- poids selon la pond déclarée + zones applicables
get_poids_appl AS (
    SELECT
        COALESCE(b.est_applicable, TRUE) AS est_applicable,
        CASE
        -- si cet indic n'est pas explicitement signalé NON appl dans cette table, alors il est appl
            WHEN COALESCE(b.est_applicable, TRUE) THEN poids_zone_declaree
            -- si l'indic n'est pas applicable sur cette zone, alors la pondération est de 0
            ELSE 0
        END AS poids_zone_appl,
        CASE
            WHEN COALESCE(b.est_applicable, TRUE) THEN poids_eval_zone_declaree
            ELSE 0
        END AS poids_eval_zone_appl,
        a.*
    FROM get_poids_declaree AS a
    LEFT JOIN
        {{ ref('int_indicateurs_zones_applicables') }} AS b
        ON a.indic_id = b.indic_id AND a.zone_id = b.zone_id
),

get_total_poids_appl_ch AS (
    SELECT
        chantier_id,
        zone_id,
        -- Total des pondérations pour ce chantier et cette zone
        SUM(poids_zone_appl) AS total_poids_zone_appl_ch,
        SUM(poids_eval_zone_appl) AS total_poids_eval_zone_appl_ch
    FROM get_poids_appl
    GROUP BY chantier_id, zone_id
),

-- Calcul de la pondération réelle
get_poids_reel AS (
    SELECT
        CASE
            WHEN total_poids_zone_appl_ch = 0 THEN 0
            ELSE 100. * poids_zone_appl / total_poids_zone_appl_ch
        END AS poids_zone_reel,
        CASE
            WHEN total_poids_eval_zone_appl_ch = 0 THEN 0
            ELSE 100. * poids_eval_zone_appl / total_poids_eval_zone_appl_ch
        END AS poids_eval_zone_reel,
        b.total_poids_zone_appl_ch,
        b.total_poids_eval_zone_appl_ch,
        a.*
    FROM
        get_poids_appl AS a
    LEFT JOIN get_total_poids_appl_ch
        AS b ON a.chantier_id = b.chantier_id
    AND a.zone_id = b.zone_id
)

--select * from get_poids_appl where chantier_id is null -- where total_poids_zone_appl_ch>100

SELECT *
FROM get_poids_reel
-- tests cas intéressants
--where poids_zone_reel>0 and poids_zone_reel<100 and poids_zone_reel<>poids_zone_declaree
--where total_poids_zone_appl_ch <100 and total_poids_zone_appl_ch>0 and poids_zone_appl>0 and poids_zone_appl<>total_poids_zone_appl_ch
ORDER BY chantier_id, zone_id
