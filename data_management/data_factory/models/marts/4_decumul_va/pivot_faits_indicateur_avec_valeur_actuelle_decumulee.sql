SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    pivot.valeur_initiale,
    pivot.valeur_actuelle,
    CASE
        WHEN parametrage.decumule_vaa_par = 'from_year_start' THEN
            pivot.valeur_actuelle - COALESCE(
                LAG(pivot.valeur_actuelle) OVER (
                    PARTITION BY pivot.indicateur_id, pivot.zone_id, EXTRACT(YEAR FROM pivot.date_releve)
                    ORDER BY pivot.date_releve
                ),
                0
            )
        WHEN parametrage.decumule_vaa_par = 'from_custom_date' THEN
            pivot.valeur_actuelle - COALESCE(
                LAG(pivot.valeur_actuelle) OVER (
                    PARTITION BY pivot.indicateur_id, pivot.zone_id
                    ORDER BY pivot.date_releve
                ),
                0
            )
        ELSE pivot.valeur_actuelle
    END AS valeur_actuelle_decumulee,
    pivot.valeur_cible_annuelle,
    pivot.valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_vi_vca_et_vcg_completees')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
    WHERE
    (
        parametrage.decumule_vaa_par = 'from_year_start' OR
        (parametrage.decumule_vaa_par = 'from_custom_date' AND pivot.date_releve >= parametrage.decumule_vaa_depuis)
    )
ORDER BY
    pivot.indicateur_id, pivot.zone_id, pivot.date_releve
