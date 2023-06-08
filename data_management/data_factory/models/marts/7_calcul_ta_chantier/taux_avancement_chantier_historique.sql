SELECT
    metadata_indicateur.chantier_id,
    avancement_indicateur.zone_id,
    avancement_indicateur.date_releve,
    CASE
        WHEN metadata_zone.maille = 'DEPT' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_dept) / 100
        WHEN metadata_zone.maille = 'REG' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_reg) / 100
        WHEN metadata_zone.maille = 'NAT' THEN SUM(avancement_indicateur.taux_avancement_annuel * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_annuel,
    CASE
        WHEN metadata_zone.maille = 'DEPT' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_dept) / 100
        WHEN metadata_zone.maille = 'REG' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_reg) / 100
        WHEN metadata_zone.maille = 'NAT' THEN SUM(avancement_indicateur.taux_avancement_annuel_borne * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_annuel_borne,
    CASE
        WHEN metadata_zone.maille = 'DEPT' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_dept) / 100
        WHEN metadata_zone.maille = 'REG' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_reg) / 100
        WHEN metadata_zone.maille = 'NAT' THEN SUM(avancement_indicateur.taux_avancement_globale * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_global,
    CASE
        WHEN metadata_zone.maille = 'DEPT' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_dept) / 100
        WHEN metadata_zone.maille = 'REG' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_reg) / 100
        WHEN metadata_zone.maille = 'NAT' THEN SUM(avancement_indicateur.taux_avancement_globale_borne * parametrage.poids_pourcent_nat) / 100
    END as taux_avancement_global_borne
FROM {{ ref('taux_avancement_indicateur')}} avancement_indicateur
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON avancement_indicateur.indicateur_id = parametrage.indicateur_id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateurs')}} metadata_indicateur ON avancement_indicateur.indicateur_id = metadata_indicateur.id
    LEFT JOIN {{ ref('stg_ppg_metadata__zones')}} metadata_zone ON avancement_indicateur.zone_id = metadata_zone.id
GROUP BY metadata_indicateur.chantier_id, avancement_indicateur.zone_id, metadata_zone.maille, avancement_indicateur.date_releve
