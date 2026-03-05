SELECT
    generate_series(
        2022, date_part('year', now())::int, 1
    ) AS jalon