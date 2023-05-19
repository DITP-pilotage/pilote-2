WITH taux_avancement_indicateur as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id ORDER BY date_releve DESC) AS row_id,
        *
    FROM {{ ref('taux_avancement_indicateur')}}
    WHERE valeur_actuelle_comparable_annuelle IS NOT NULL
      AND valeur_actuelle_comparable_globale IS NOT NULL
    -- on retire les lignes dont la valeur actuelle est pas remplie
    -- => condition a vérifier mais en gros fallait pas récupérer la dernière par groupe car sinon tu as que la valeur cible sur cette ligne donc TA = NULL
)

SELECT
    metadata_indicateur.chantier_id,
    avancement_indicateur.zone_id,
    MAX(avancement_indicateur.date_releve) as date_releve,
    CASE
        WHEN zone_id like 'D%' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_dept) / 100
        WHEN zone_id like 'R%' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_reg) / 100
        WHEN zone_id = 'FRANCE' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_annuel,
    CASE
        WHEN zone_id like 'D%' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_dept) / 100
        WHEN zone_id like 'R%' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_reg) / 100
        WHEN zone_id = 'FRANCE' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_annuel_borne,
    CASE
        WHEN zone_id like 'D%' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_dept) / 100
        WHEN zone_id like 'R%' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_reg) / 100
        WHEN zone_id = 'FRANCE' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_globale,
    CASE
        WHEN zone_id like 'D%' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_dept) / 100
        WHEN zone_id like 'R%' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_reg) / 100
        WHEN zone_id = 'FRANCE' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_globale_borne
FROM taux_avancement_indicateur avancement_indicateur
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON avancement_indicateur.indicateur_id = parametrage.indicateur_id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateurs')}} metadata_indicateur ON avancement_indicateur.indicateur_id = metadata_indicateur.id
WHERE avancement_indicateur.row_id = 1
GROUP BY metadata_indicateur.chantier_id, avancement_indicateur.zone_id
