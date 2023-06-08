WITH taux_avancement_chantier_historique as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY chantier_id, zone_id ORDER BY date_releve DESC) AS row_id,
        *
    FROM {{ ref('taux_avancement_chantier_historique')}}
    WHERE taux_avancement_annuel IS NOT NULL
    -- on retire les lignes où le taa n'est pas calculé car si pas de taa alors pas de taab, tag, tagb
)

SELECT
    *
    FROM taux_avancement_chantier_historique
WHERE row_id = 1

