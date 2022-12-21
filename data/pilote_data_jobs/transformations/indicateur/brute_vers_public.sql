TRUNCATE TABLE public.indicateur;

INSERT INTO public.indicateur
    SELECT DISTINCT ON (effect_id)
        indic_id as id,
        indic_nom as nom,
        indic_parent_ch as chantier_id,
        valeur_cible as objectif_valeur_cible,
        bounded_progress as objectif_taux_avancement,
        to_char(extract(year from date_valeur_cible), '9999') as objectif_date_valeur_cible,
        indic_type as type_id,
        indic_type_name as type_nom,
        indic_is_baro as est_barometre,
        indic_is_phare as est_phare,
        date_valeur_actuelle,
        date_valeur_initiale,
        valeur_actuelle,
        valeur_initiale
    FROM raw_data.fact_progress_indicateur fpi
        JOIN raw_data.dim_tree_nodes dtn ON fpi.tree_node_id=dtn.tree_node_id
        JOIN raw_data.dim_structures ds ON dtn.structure_id=ds.structure_id
        INNER JOIN raw_data.metadata_indicateur mi on mi.indic_nom=fpi.effect_id
        LEFT JOIN raw_data.indicateur_type it on it.indic_type_id=mi.indic_type
    WHERE ds.structure_name='Réforme'
    ORDER BY effect_id, period_id DESC;
