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
        {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} -- noqa: LT05
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
        indic.id AS indic_id,
        indic.chantier_id,
        base_mailles.maille,
        last_vaca.last_va_date
    FROM base_mailles
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS indic
    LEFT JOIN {{ ref('get_last_vaca_maille') }} AS last_vaca
        ON last_vaca.indic_id = indic.id
        -- ajouter jointure avec la maille
        AND base_mailles.maille = last_vaca.maille
    LEFT JOIN
        {{ ref('stg_ppg_metadata__chantiers') }} AS chantier
        ON indic.chantier_id = chantier.id
    LEFT JOIN src_indic_territo
        ON indic.id = src_indic_territo.indic_id
    WHERE
        -- Pour DEPT: les indics territo des chantiers territo + pilotés au DEPT
        (
            base_mailles.maille = 'DEPT'
            AND chantier.est_territorialise
            AND src_indic_territo.indic_territo
            AND chantier.maille_pilotage = 'DEPT'
        )
        -- Pour REG: les indics territo des chantiers territo + 
        OR (
            base_mailles.maille = 'REG'
            AND chantier.est_territorialise
            AND src_indic_territo.indic_territo
            AND chantier.maille_pilotage IN ('REG', 'DEPT')
        )
        -- Pour NAT: Tous les indics
        OR (base_mailles.maille = 'NAT')
--ORDER BY indic.id, base_mailles.maille
),

-- Récupération de la configuration temporelle
src_config_tempo AS (
    SELECT
        indic_id,
        periodicite,
        delai_disponibilite
    FROM
        {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} -- noqa: LT05
    ORDER BY indic_id
),

-- Calcul de la prochaine date de VA
get_prochaine_date_va AS (
    SELECT
        src_indicateurs.indic_id,
        src_indicateurs.chantier_id,
        src_indicateurs.maille,
        src_indicateurs.last_va_date,
        config_tempo.periodicite,
        config_tempo.delai_disponibilite,
        -- 	On ajouter X mois suivant la valeur de periodicite renseignée
        CASE config_tempo.periodicite
            WHEN 'Mensuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '1 month'
            WHEN 'Bimestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '2 months'
            WHEN 'Trimestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '3 months'
            WHEN 'Semestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '6 months'
            WHEN 'Annuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '1 year'
            WHEN 'Bi-annuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '2 year'
            WHEN '3 ans'
                THEN src_indicateurs.last_va_date + INTERVAL '3 year'
            WHEN '6 ans'
                THEN src_indicateurs.last_va_date + INTERVAL '6 year'
        END AS prochaine_date_va
    FROM src_indicateurs
    LEFT JOIN src_config_tempo AS config_tempo
        ON src_indicateurs.indic_id = config_tempo.indic_id
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
