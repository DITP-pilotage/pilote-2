
-- Retourne la dernière VACG pour chaque année + fill année suivantes

WITH tous_indicateurs_et_zones_jalons_a_etudier AS (
    SELECT
        last_vacg_tous_jalons.indic_id,
        last_vacg_tous_jalons.zone_id,
        last_vacg_tous_jalons.dernier_jalon,
        last_vacg_tous_jalons.derniere_vacg,
        last_vacg_tous_jalons.derniere_date_vacg,
        jalons.jalon AS jalon_a_completer
    FROM "dev_pilote__6230"."df3"."get_last_vacg_tous_jalons" AS last_vacg_tous_jalons
    CROSS JOIN "dev_pilote__6230"."df3"."jalons_a_etudier" AS jalons
),

intermediate AS (
    SELECT
        indics_zones_jalons.indic_id,
        indics_zones_jalons.zone_id,
        indics_zones_jalons.dernier_jalon,
        indics_zones_jalons.derniere_vacg,
        indics_zones_jalons.derniere_date_vacg,
        indics_zones_jalons.jalon_a_completer,
        last_vacg_jalon_nofill.jalon,
        last_vacg_jalon_nofill.metric_date,
        last_vacg_jalon_nofill.vacg,
        CASE
            WHEN
                last_vacg_jalon_nofill.jalon
                = indics_zones_jalons.jalon_a_completer
                THEN last_vacg_jalon_nofill.vacg
            WHEN
                indics_zones_jalons.dernier_jalon
                < indics_zones_jalons.jalon_a_completer
                THEN indics_zones_jalons.derniere_vacg
        END AS vacg_filled,
        CASE
            WHEN
                last_vacg_jalon_nofill.jalon
                = indics_zones_jalons.jalon_a_completer
                THEN last_vacg_jalon_nofill.metric_date
            WHEN
                indics_zones_jalons.dernier_jalon
                < indics_zones_jalons.jalon_a_completer
                THEN indics_zones_jalons.derniere_date_vacg
        END AS date_vacg_filled

    FROM tous_indicateurs_et_zones_jalons_a_etudier AS indics_zones_jalons
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_last_vacg_jalon_nofill" AS last_vacg_jalon_nofill
        ON
            indics_zones_jalons.zone_id = last_vacg_jalon_nofill.zone_id
            AND indics_zones_jalons.indic_id = last_vacg_jalon_nofill.indic_id
            AND indics_zones_jalons.jalon_a_completer
            = last_vacg_jalon_nofill.jalon
)

SELECT
    indic_id,
    zone_id,
    jalon_a_completer AS jalon,
    vacg_filled AS vacg,
    date_vacg_filled AS date_vacg
FROM intermediate
-- ne retourne pas de ligne pour des valeurs qui n'ont pas été remplies
-- exemple 2022 si la dernière VACG est en 2023
WHERE vacg_filled IS NOT NULL