SELECT
    generate_series(
        {{ var('premier_jalon_va') }}, date_part('year', now())::int, 1
    ) AS jalon
