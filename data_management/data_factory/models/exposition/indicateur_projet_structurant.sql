SELECT
    DISTINCT ON (indicateur_nom)
    {{ dbt_utils.surrogate_key(['indicateur_nom']) }} as id,
    data_kpis.indicateur_nom as nom,
    data_kpis.projet_structurant_code,
    CASE
        WHEN type_nom = 'RealisationHausse' OR type_nom = 'RealisationBaisse' THEN 'REALISATION'
        WHEN type_nom = 'FinancierHausse' OR type_nom = 'FinancierBaisse' THEN 'FINANCIER'
        ELSE 'IMPACT'
        END as type_id,
    indicateur_description as description,
    NULL as source,
    NULL as mode_de_calcul,
    fact_progress_kpis_ps.valeur_actuelle as valeur_actuelle,
    fact_progress_kpis_ps.valeur_initiale as valeur_initiale,
    fact_progress_kpis_ps.valeur_cible as valeur_cible,
    fact_progress_kpis_ps.avancement as taux_avancement,
    fact_progress_kpis_ps.date_valeur_actuelle as date_valeur_actuelle,
    fact_progress_kpis_ps.date_valeur_initiale as date_valeur_initiale,
    fact_progress_kpis_ps.date_valeur_cible as date_valeur_cible,
    data_kpis.valeur_actuelle_date as date_taux_avancement
    FROM {{ ref('stg_dfakto__ps_view_data_kpis') }} data_kpis
        LEFT JOIN {{ ref('stg_dfakto__fact_progress_kpis') }} fact_progress_kpis_ps
            ON data_kpis.indicateur_nom = fact_progress_kpis_ps.kpi_nom
    ORDER BY indicateur_nom
