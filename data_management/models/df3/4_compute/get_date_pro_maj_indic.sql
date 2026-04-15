{{ config(materialized = 'table') }}

-- Cette table indique la prochaine date théorique de mise à jour des données
--	en fonction de la dernière date de màj + périodicité déclarée
--	pour chaque {indic, maille}

WITH
-- Liste des indicateurs territo
src_indic_territo AS (
    SELECT
        indic_id,
        indic_territorialise AS indic_territo
    FROM
        {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }}
    WHERE indic_territorialise
),

-- Liste des mailles pour un CROSS JOIN à suivre
base_mailles AS (
    SELECT * FROM (VALUES ('DEPT'), ('REG'), ('NAT')) AS a (maille)
),

-- Base des indicateurs à étudier
-- 	+ date de la VA dispo la + récente
src_indicateurs AS (
    SELECT
        spmi.id AS indic_id,
        i.chantier_id,
        base_mailles.maille,
        last_vaca.last_va_date
    FROM base_mailles
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS spmi
    LEFT JOIN {{ ref('get_last_vaca_maille') }} AS last_vaca
        ON last_vaca.indic_id = spmi.id
        -- ajouter jointure avec la maille
        AND base_mailles.maille = last_vaca.maille
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS i ON spmi.id = i.id
    LEFT JOIN
        {{ ref('stg_ppg_metadata__chantiers') }} AS cchantier
        ON i.chantier_id = cchantier.id
    LEFT JOIN src_indic_territo AS it ON spmi.id = it.indic_id
    WHERE
        -- Pour DEPT: les indics territo des chantiers territo + pilotés au DEPT
        (
            base_mailles.maille = 'DEPT'
            AND cchantier.est_territorialise
            AND it.indic_territo
            AND maille_pilotage = 'DEPT'
        )
        -- Pour REG: les indics territo des chantiers territo + 
        OR (
            base_mailles.maille = 'REG'
            AND cchantier.est_territorialise
            AND it.indic_territo
            AND maille_pilotage IN ('REG', 'DEPT')
        )
        -- Pour NAT: Tous les indics
        OR (base_mailles.maille = 'NAT')
--ORDER BY spmi.id, base_mailles.maille
),

-- Récupération de la configuration temporelle
src_config_tempo AS (
    SELECT
        indic_id,
        periodicite,
        delai_disponibilite
    FROM
        {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }}
    ORDER BY indic_id
),

-- Calcul de la prochaine date de VA
get_prochaine_date_va AS (
    SELECT
        a.indic_id,
        a.chantier_id,
        a.maille,
        a.last_va_date,
        b.periodicite,
        b.delai_disponibilite,
        -- 	On ajouter X mois suivant la valeur de periodicite renseignée
        CASE b.periodicite
            WHEN 'Mensuelle' THEN a.last_va_date + INTERVAL '1 month'
            WHEN 'Bimestrielle' THEN a.last_va_date + INTERVAL '2 months'
            WHEN 'Trimestrielle' THEN a.last_va_date + INTERVAL '3 months'
            WHEN 'Semestrielle' THEN a.last_va_date + INTERVAL '6 months'
            WHEN 'Annuelle' THEN a.last_va_date + INTERVAL '1 year'
            WHEN 'Bi-annuelle' THEN a.last_va_date + INTERVAL '2 year'
            WHEN '3 ans' THEN a.last_va_date + INTERVAL '3 year'
            WHEN '6 ans' THEN a.last_va_date + INTERVAL '6 year'
        END AS prochaine_date_va
    FROM src_indicateurs AS a
    LEFT JOIN src_config_tempo AS b ON a.indic_id = b.indic_id
),

-- Calcul de la prochaine date de màj
--	prochaine_date_maj= prochaine_date_va+delai_disponibilite
get_prochaine_date_maj_debut_mois AS (
    SELECT
        *,
        (prochaine_date_va + delai_disponibilite * INTERVAL '1 month')
            AS prochaine_date_maj_debut_mois
    FROM get_prochaine_date_va
),

-- On arrondit la date à la FIN du mois
get_prochaine_date_maj AS (
    SELECT
        *,
        (
            prochaine_date_maj_debut_mois::DATE
            + INTERVAL '1 month'
            - INTERVAL '1 day'
        ) AS prochaine_date_maj
    FROM get_prochaine_date_maj_debut_mois
),

-- Calcule si données à jour + distance à la prochaine màj (en jours)
get_est_a_jour_et_date_maj_jours AS (
    SELECT
        *,
        COALESCE(prochaine_date_maj > CURRENT_DATE, FALSE) AS est_a_jour,
        EXTRACT(DAY FROM prochaine_date_maj - CURRENT_DATE)
            AS prochaine_date_maj_jours
    FROM get_prochaine_date_maj
--ORDER BY indic_id, "maille"
)

SELECT * FROM get_est_a_jour_et_date_maj_jours
