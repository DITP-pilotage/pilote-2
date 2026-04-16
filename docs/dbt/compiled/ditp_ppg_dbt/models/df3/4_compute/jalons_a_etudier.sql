SELECT
    GENERATE_SERIES(
        2022, DATE_PART('year', NOW())::INT, 1
    ) AS jalon