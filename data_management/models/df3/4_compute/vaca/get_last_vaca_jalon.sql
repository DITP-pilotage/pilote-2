{{
  config(
    materialized = 'table',
    )
}}
-- Retourne la dernière VACA pour chaque année + fill année suivantes


WITH tous_indicateurs_et_zones_jalons_a_etudier AS (
    SELECT
        last_vaca_tous_jalons.indic_id,
        last_vaca_tous_jalons.zone_id,
        last_vaca_tous_jalons.dernier_jalon,
        last_vaca_tous_jalons.derniere_vaca,
        last_vaca_tous_jalons.derniere_date_vaca,
        jalons.jalon AS jalon_a_completer
    FROM {{ ref('get_last_vaca_tous_jalons') }} AS last_vaca_tous_jalons
    CROSS JOIN {{ ref('jalons_a_etudier') }} AS jalons
),

intermediate AS (
    SELECT
        indics_zones_jalons.indic_id,
        indics_zones_jalons.zone_id,
        indics_zones_jalons.dernier_jalon,
        indics_zones_jalons.derniere_vaca,
        indics_zones_jalons.derniere_date_vaca,
        indics_zones_jalons.jalon_a_completer,
        last_vaca_jalon_nofill.jalon,
        last_vaca_jalon_nofill.metric_date,
        last_vaca_jalon_nofill.vaca,
        CASE
            WHEN
                last_vaca_jalon_nofill.jalon
                = indics_zones_jalons.jalon_a_completer
                THEN last_vaca_jalon_nofill.vaca
            WHEN
                indics_zones_jalons.dernier_jalon
                < indics_zones_jalons.jalon_a_completer
                THEN indics_zones_jalons.derniere_vaca
        END AS vaca_filled,
        CASE
            WHEN
                last_vaca_jalon_nofill.jalon
                = indics_zones_jalons.jalon_a_completer
                THEN last_vaca_jalon_nofill.metric_date
            WHEN
                indics_zones_jalons.dernier_jalon
                < indics_zones_jalons.jalon_a_completer
                THEN indics_zones_jalons.derniere_date_vaca
        END AS date_vaca_filled,
        ROW_NUMBER() OVER (
            PARTITION BY
                indics_zones_jalons.indic_id,
                indics_zones_jalons.zone_id,
                indics_zones_jalons.jalon_a_completer
            ORDER BY
                CASE
                    WHEN (
                        CASE
                            WHEN
                                last_vaca_jalon_nofill.jalon
                                = indics_zones_jalons.jalon_a_completer
                                THEN last_vaca_jalon_nofill.metric_date
                            WHEN
                                indics_zones_jalons.dernier_jalon
                                < indics_zones_jalons.jalon_a_completer
                                THEN indics_zones_jalons.derniere_date_vaca
                        END
                    ) IS NULL THEN 1 ELSE 0
                END ASC,
                (
                    CASE
                        WHEN
                            last_vaca_jalon_nofill.jalon
                            = indics_zones_jalons.jalon_a_completer
                            THEN last_vaca_jalon_nofill.metric_date
                        WHEN
                            indics_zones_jalons.dernier_jalon
                            < indics_zones_jalons.jalon_a_completer
                            THEN indics_zones_jalons.derniere_date_vaca
                    END
                ) DESC
        ) AS r

    FROM tous_indicateurs_et_zones_jalons_a_etudier AS indics_zones_jalons
    LEFT JOIN
        {{ ref('get_last_vaca_jalon_nofill') }} AS last_vaca_jalon_nofill
        ON
            indics_zones_jalons.zone_id = last_vaca_jalon_nofill.zone_id
            AND indics_zones_jalons.indic_id = last_vaca_jalon_nofill.indic_id
            AND indics_zones_jalons.jalon_a_completer
            = last_vaca_jalon_nofill.jalon
)

SELECT
    indic_id,
    zone_id,
    jalon_a_completer AS jalon,
    vaca_filled AS vaca,
    date_vaca_filled AS date_vaca
FROM intermediate
-- ne retourne pas de ligne pour des valeurs qui n'ont pas été remplies
-- exemple 2022 si la dernière VACA est en 2023
WHERE
    vaca_filled IS NOT NULL
    AND r = 1
ORDER BY
    indic_id,
    zone_id,
    jalon_a_completer
