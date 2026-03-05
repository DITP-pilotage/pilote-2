
-- Retourne la dernière VACG pour chaque année + fill année suivantes

WITH tous_indicateurs_et_zones_jalons_a_etudier AS (
    SELECT
        a.indic_id,
        a.zone_id,
        a.dernier_jalon,
        a.derniere_vacg,
        a.derniere_date_vacg,
        b.jalon AS jalon_a_completer
    FROM "dev_pilote__6230"."df3"."get_last_vacg_tous_jalons" AS a
    CROSS JOIN "dev_pilote__6230"."df3"."jalons_a_etudier" AS b
    --WHERE a.indic_id = 'IND-001'
),

intermediate AS (
    SELECT
        a.indic_id,
        a.zone_id,
        a.dernier_jalon,
        a.derniere_vacg,
        a.derniere_date_vacg,
        a.jalon_a_completer,
        b.jalon,
        b.metric_date,
        b.vacg,
        CASE
            WHEN b.jalon = a.jalon_a_completer THEN vacg
            WHEN a.dernier_jalon < a.jalon_a_completer THEN derniere_vacg
        END AS vacg_filled,
        CASE
            WHEN b.jalon = a.jalon_a_completer THEN b.metric_date
            WHEN a.dernier_jalon < a.jalon_a_completer THEN a.derniere_date_vacg
        END AS date_vacg_filled

    FROM tous_indicateurs_et_zones_jalons_a_etudier AS a
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_last_vacg_jalon_nofill" AS b
        ON
            a.zone_id = b.zone_id
            AND a.indic_id = b.indic_id
            AND a.jalon_a_completer = b.jalon
)

SELECT
    indic_id,
    zone_id,
    jalon_a_completer AS jalon,
    vacg_filled AS vacg,
    date_vacg_filled AS date_vacg
FROM intermediate
-- ne retourne pas de ligne pour des valeurs qui n'ont pas été remplies, exemple 2022 si la dernière VACG est en 2023
WHERE vacg_filled IS NOT null
order by indic_id, zone_id, jalon_a_completer