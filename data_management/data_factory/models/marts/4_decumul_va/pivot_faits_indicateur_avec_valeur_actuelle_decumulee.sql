SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    pivot.indicateur_valeur_initiale,
    pivot.indicateur_valeur_actuelle,
    CASE
        WHEN parametrage.decumule_vaa_par = 'from_year_start' THEN
            pivot.indicateur_valeur_actuelle - COALESCE(
                LAG(pivot.indicateur_valeur_actuelle) OVER (
                    PARTITION BY pivot.indicateur_id, pivot.zone_id, EXTRACT(YEAR FROM pivot.date_releve)
                    ORDER BY pivot.date_releve
                ),
                0
            )
        ELSE NULL
    END AS valeur_actuelle_decumulee,
    pivot.indicateur_valeur_cible_annuelle,
    pivot.indicateur_valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_avec_vi_vca_et_vcg_completees')}} pivot
    LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
ORDER BY
    pivot.indicateur_id, pivot.zone_id, pivot.date_releve
