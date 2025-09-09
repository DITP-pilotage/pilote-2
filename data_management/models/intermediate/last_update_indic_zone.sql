WITH
    dernier_import AS (
        SELECT
            indic_id,
            zone_id,
            rapport_id,
            COUNT(*) OVER (
                PARTITION BY
                    indic_id,
                    zone_id
            ) AS n,
            date_import AS dernier_import_date
        FROM (
                SELECT
                    indic_id, zone_id, rapport_id, date_import, ROW_NUMBER() OVER (
                        PARTITION BY
                            indic_id, zone_id
                        ORDER BY date_import DESC
                    ) AS rn
                FROM {{ source('import_from_files', 'mesure_indicateur') }}
            )
        WHERE
            rn = 1
        ORDER BY indic_id, zone_id
    )
SELECT
    dernier_import.indic_id,
    territoire.zone_id,
    territoire.code AS territoire_code,
    dernier_import.rapport_id AS dernier_import_rapport_id,
    dernier_import.dernier_import_date,
    CONCAT(
        UPPER(LEFT(utilisateur.prenom, 1)),
        LOWER(
            SUBSTRING(
                utilisateur.prenom,
                2,
                LENGTH(utilisateur.prenom)
            )
        ),
        ' ',
        UPPER(LEFT(utilisateur.nom, 1)),
        LOWER(
            SUBSTRING(
                utilisateur.nom,
                2,
                LENGTH(utilisateur.nom)
            )
        )
    ) AS dernier_import_auteur
FROM
    dernier_import
    LEFT JOIN  {{ source('db_schema_public', 'rapport_import_mesure_indicateur') }} rapport ON dernier_import.rapport_id = rapport.id
    LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} utilisateur ON rapport.utilisateur_email = utilisateur.email
    LEFT JOIN {{ source('db_schema_public', 'territoire') }} territoire ON territoire.zone_id = dernier_import.zone_id