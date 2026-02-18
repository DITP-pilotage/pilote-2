begin;
WITH updated AS (
    UPDATE utilisateur
        SET fonction = NULL
        WHERE fonction = ''
        RETURNING 1
)
SELECT COUNT(*) FROM updated;
commit;
