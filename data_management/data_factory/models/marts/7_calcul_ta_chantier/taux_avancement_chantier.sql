WITH taux_avancement_chantier_historique as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY chantier_id, zone_id ORDER BY date_releve DESC) AS row_id,
        *
    FROM {{ ref('taux_avancement_chantier_historique')}}
    WHERE taux_avancement_annuel IS NOT NULL
    -- on retire les lignes dont le ta n'est pas calculé
    -- => condition a vérifier mais en gros fallait pas récupérer la dernière par groupe car sinon tu as que la valeur cible sur cette ligne donc TA = NULL
)

SELECT
    *
    FROM taux_avancement_chantier_historique
WHERE row_id = 1

