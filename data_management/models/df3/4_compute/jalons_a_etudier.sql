SELECT
    GENERATE_SERIES(
        {{ var('premier_jalon_va') }}, DATE_PART('year', NOW())::INT, 1
    ) AS jalon
