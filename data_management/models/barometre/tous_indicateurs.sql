WITH
-- Liste des indicateurs du baromètre
indic_baro AS (
    SELECT id FROM {{ ref('stg_ppg_metadata__indicateurs') }}
    WHERE est_barometre
),

-- Données des indicateurs du baromètre
donnees AS (
    SELECT
        i.*,
        z.maille AS zone_type
    FROM
        {{ ref('indicateur_territoire') }} AS i
    -- On ne garde que les indicateurs au baromètres
    RIGHT JOIN indic_baro AS b ON i.id = b.id
    -- pour: Ajout de la zone_type (maille)
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS z ON i.zone_id = z.id
),

-- Données VA
export_va AS (
    SELECT
        a.id AS indic_id,
        a.zone_id AS enforce_zone_id,
        a.zone_type AS maille,
        -- Unnest des valeurs des VA
        va_date_unnest_computed AS metric_enforce_date,
        -- Unnest des dates des VA
        va_unnest_computed AS indic_va
    FROM donnees AS a
    LEFT JOIN
        {{ ref('df3_indicateur_unnest_va') }} AS b
        ON a.id = b.id AND a.territoire_code = b.territoire_code
    -- On ne garde que les lignes où une VA est dispo
    WHERE evolution_avancement IS NOT NULL
),

-- Données VI
export_vi AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_initiale AS metric_enforce_date,
        -- VI
        valeur_initiale AS indic_vi
    FROM donnees
    -- On ne garde que les lignes où une VI est dispo
    WHERE valeur_initiale IS NOT NULL
),

-- Données VC
export_vc AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_cible_mandat AS metric_enforce_date,
        -- VC
        valeur_cible_mandat AS indic_vc
    FROM donnees
    -- On ne garde que les lignes où une VC est dispo
    WHERE valeur_cible_mandat IS NOT NULL
),

-- Données TA
export_ta AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_actuelle_mandat AS metric_enforce_date,
        -- TA
        taux_avancement_mandat AS indic_ta
    FROM donnees
    -- On ne garde que les lignes où un TA est dispo
    WHERE taux_avancement_mandat IS NOT NULL
),

-- Combinaison des VI,VA,VC,TA
merge_exports AS (
    SELECT
        COALESCE(a.indic_id, b.indic_id, c.indic_id, d.indic_id) AS indic_id,
        COALESCE(
            a.enforce_zone_id,
            b.enforce_zone_id,
            c.enforce_zone_id,
            d.enforce_zone_id
        ) AS enforce_zone_id,
        COALESCE(
            a.metric_enforce_date,
            b.metric_enforce_date,
            c.metric_enforce_date,
            d.metric_enforce_date
        ) AS metric_enforce_date,
        COALESCE(a.maille, b.maille, c.maille, d.maille) AS maille,
        b.indic_vi,
        a.indic_va,
        c.indic_vc,
        d.indic_ta
    FROM
        export_va AS a
    FULL JOIN
        export_vi AS b
        ON
            a.indic_id = b.indic_id
            AND a.enforce_zone_id = b.enforce_zone_id
            AND a.metric_enforce_date = b.metric_enforce_date
    FULL JOIN
        export_vc AS c
        ON
            a.indic_id = c.indic_id
            AND a.enforce_zone_id = c.enforce_zone_id
            AND a.metric_enforce_date = c.metric_enforce_date
    FULL JOIN
        export_ta AS d
        ON
            a.indic_id = d.indic_id
            AND a.enforce_zone_id = d.enforce_zone_id
            AND a.metric_enforce_date = d.metric_enforce_date
),

-- On arrondit les VI,VA,VC,TA à deux décimales
round_2_dec AS (
    SELECT
        indic_id,
        enforce_zone_id,
        metric_enforce_date,
        maille,
        ROUND(indic_vi::NUMERIC, 2) AS indic_vi,
        ROUND(indic_va::NUMERIC, 2) AS indic_va,
        ROUND(indic_vc::NUMERIC, 2) AS indic_vc,
        ROUND(indic_ta::NUMERIC, 2) AS indic_ta
    FROM merge_exports
)

SELECT *
FROM round_2_dec
ORDER BY indic_id, maille, enforce_zone_id, metric_enforce_date
