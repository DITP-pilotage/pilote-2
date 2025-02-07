{{
  config(
    materialized = 'table',
    )
}}
-- Retourne la dernière VACA pour chaque année + fill année suivantes

WITH tous_indicateurs_et_zones_jalons_a_etudier AS (
    SELECT
        a.indic_id,
        a.zone_id,
        a.dernier_jalon,
        a.derniere_vaca,
        a.derniere_date_vaca,
        b.jalon AS jalon_a_completer
    FROM {{ ref('get_last_vaca_tous_jalons') }} AS a
    CROSS JOIN {{ ref('jalons_a_etudier') }} AS b
    --WHERE a.indic_id = 'IND-001'
),

intermediate AS (
    SELECT
        a.indic_id,
        a.zone_id,
        a.dernier_jalon,
        a.derniere_vaca,
        a.derniere_date_vaca,
        a.jalon_a_completer,
        b.jalon,
        b.metric_date,
        b.vaca,
        CASE
            WHEN b.jalon = a.jalon_a_completer THEN vaca
            WHEN a.dernier_jalon < a.jalon_a_completer THEN derniere_vaca
        END AS vaca_filled,
        CASE
            WHEN b.jalon = a.jalon_a_completer THEN b.metric_date
            WHEN a.dernier_jalon < a.jalon_a_completer THEN a.derniere_date_vaca
        END AS date_vaca_filled

    FROM tous_indicateurs_et_zones_jalons_a_etudier AS a
    LEFT JOIN
        {{ ref('get_last_vaca_jalon_nofill') }} AS b
        ON
            a.zone_id = b.zone_id
            AND a.indic_id = b.indic_id
            AND a.jalon_a_completer = b.jalon
)

SELECT
    indic_id,
    zone_id,
    jalon_a_completer AS jalon,
    vaca_filled AS vaca,
    date_vaca_filled AS date_vaca
FROM intermediate
-- ne retourne pas de ligne pour des valeurs qui n'ont pas été remplies, exemple 2022 si la dernière VACA est en 2023
WHERE vaca_filled IS NOT null
order by indic_id, zone_id, jalon_a_completer
