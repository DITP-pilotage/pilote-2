CREATE TABLE mesure_indicateur_tmp as
with
    mesure_date_normalisee as (
        SELECT mesure_indicateur.*,
            -- normalisation de la date au premier jour du mois
            SUBSTRING(metric_date, 1, 7) || '-01' AS metric_date_norm, ROW_NUMBER() OVER (
                PARTITION BY
                    indic_id, zone_id, metric_type, SUBSTRING(metric_date, 1, 7)
                ORDER BY date_import DESC
            ) AS rn
        FROM raw_data.mesure_indicateur
        WHERE
            indic_id IN (
                SELECT id
                FROM indicateur_identite
            )
    )
SELECT *
FROM mesure_date_normalisee
WHERE
    rn = 1;

-- Préparation des données avec ranking
WITH
    ranked_data AS (
        SELECT
            indic_id,
            zone_id,
            metric_value,
            date_import,
            rapport_id,
            metric_date_norm as metric_date,
            ROW_NUMBER() OVER (
                PARTITION BY
                    indic_id,
                    zone_id,
                    metric_date_norm
                ORDER BY date_import DESC
            ) AS rn
        FROM mesure_indicateur_tmp
        WHERE
            metric_type = 'va'
    ),
    latest_dates AS (
        SELECT
            indic_id,
            zone_id,
            MAX(metric_date) AS max_metric_date
        FROM ranked_data
        WHERE
            rn = 1
        GROUP BY
            indic_id,
            zone_id
    ),
    final_data AS (
        SELECT
            rd.indic_id,
            rd.zone_id,
            CASE
                WHEN rd.metric_value IN ('null', 'undefined', '') THEN NULL
                ELSE rd.metric_value
            END AS metric_value,
            rd.metric_date,
            rd.date_import,
            rd.rapport_id,
            u.id AS utilisateur_id,
            ld.max_metric_date,
            t.code AS territoire_code
        FROM
            ranked_data rd
            LEFT JOIN rapport_import_mesure_indicateur rapport ON rapport.id = rd.rapport_id
            LEFT JOIN utilisateur u ON u.email = rapport.utilisateur_email
            LEFT JOIN latest_dates ld ON ld.indic_id = rd.indic_id
            AND ld.zone_id = rd.zone_id
            LEFT JOIN territoire t ON t.zone_id = rd.zone_id
        WHERE
            rn = 1
            AND metric_value IS NOT NULL
            AND rapport.utilisateur_email IS NOT NULL
    )
    -- Insertion des valeurs courantes et historisées
INSERT INTO
    indicateur_territoire_valeur_evenement (
        id,
        indic_id,
        territoire_code,
        type_evenement,
        type_valeur,
        donnees_complementaires,
        date_valeur,
        valeur,
        ordre,
        date_creation,
        date_modification,
        id_auteur_modification,
        correlation_id
    )
SELECT
    gen_random_uuid () AS id,
    indic_id,
    territoire_code,
    'VALEUR_CREEE'::type_evenement AS type_evenement,
    'VALEUR_AVANCEMENT'::type_valeur AS type_valeur,
    '{}'::jsonb AS donnees_complementaires,
    metric_date::date AS date_valeur,
    metric_value::float AS valeur,
    1 AS ordre,
    date_import AS date_creation,
    date_import AS date_modification,
    utilisateur_id AS id_auteur_modification,
    gen_random_uuid () AS correlation_id
FROM final_data
UNION ALL
SELECT
    gen_random_uuid () AS id,
    indic_id,
    territoire_code,
    'VALEUR_HISTORISEE'::type_evenement AS type_evenement,
    'VALEUR_AVANCEMENT'::type_valeur AS type_valeur,
    '{}'::jsonb AS donnees_complementaires,
    metric_date::date AS date_valeur,
    metric_value::float AS valeur,
    2 AS ordre,
    date_import AS date_creation,
    date_import AS date_modification,
    utilisateur_id AS id_auteur_modification,
    gen_random_uuid () AS correlation_id
FROM final_data
WHERE
    metric_date <> max_metric_date
ORDER BY
    indic_id,
    territoire_code,
    date_valeur;

-- Insertion des propositions de valeurs
INSERT INTO
    indicateur_territoire_valeur_evenement (
        id,
        indic_id,
        territoire_code,
        type_evenement,
        type_valeur,
        donnees_complementaires,
        date_valeur,
        valeur,
        ordre,
        date_creation,
        date_modification,
        id_auteur_modification,
        correlation_id
    )
SELECT
    gen_random_uuid () AS id,
    indic_id,
    territoire_code,
    'PROPOSITION_VALEUR_CREEE'::type_evenement AS type_evenement,
    'VALEUR_AVANCEMENT'::type_valeur AS type_valeur,
    jsonb_build_object(
        'motif',
        pva.motif_proposition,
        'source_donnee_methode_calcul',
        pva.source_donnee_methode_calcul
    ) AS donnees_complementaires,
    date_valeur_actuelle AS date_valeur,
    valeur_actuelle_proposee AS valeur,
    2 AS ordre,
    date_proposition AS date_creation,
    date_proposition AS date_modification,
    id_auteur_modification AS id_auteur_modification,
    gen_random_uuid () AS correlation_id
FROM
    proposition_valeur_actuelle pva
    LEFT JOIN indicateur_identite ON indicateur_identite.id = pva.indic_id
    LEFT JOIN territoire ON territoire.code = pva.territoire_code
WHERE
    pva.statut = 'EN_COURS'
    AND (
        maille_reg_agregee IS FALSE
        OR territoire."maille" <> 'reg'
    );

DROP TABLE mesure_indicateur_tmp;