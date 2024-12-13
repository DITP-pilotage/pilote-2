-- cf dbt doc

WITH dates_referentielles AS (
    SELECT
        '{{ var("dateBasculeTauxAnnuelAnneeCouranteString") }}' AS date_bascule,
        now()::date AS date_aujourdhui
),

-- Calcule la date de bascule dans l'année courante
get_date_bascule_annee_courante AS (
    SELECT
        date_bascule,
        date_aujourdhui,
        concat(
            date_part('year', date_aujourdhui),
            '-',
            date_part('month', date_bascule::date),
            '-',
            date_part('day', date_bascule::date)
        )::date AS date_bascule_annee_courante
    FROM dates_referentielles
),

-- Calcule si la date de bascule est dépassée
get_depassement AS (
    SELECT
        date_bascule,
        date_aujourdhui,
        date_bascule_annee_courante,
        now() > date_bascule_annee_courante AS date_depassee
    FROM get_date_bascule_annee_courante
)

SELECT * FROM get_depassement
