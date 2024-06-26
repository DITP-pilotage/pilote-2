{{ config(
    enabled=true,
    tags="data_ingestion",
    severity = "error",
    store_failures = true,
    limit = 100,
    meta={"is_demo": "false"}
) }}

SELECT * FROM {{ref('metadata_chantiers')}} 
WHERE 
    -- ID match regex 'CH-XXX'
    chantier_id NOT SIMILAR TO 'CH-\d\d\d' OR
    -- le chantier a un nom
    ch_nom is NULL OR
    -- le dp n'est pas vide (meme si cette valeur n'est plus utilisée)
    ch_dp is NULL OR
    -- ID PPG bien formé
    ch_ppg NOT SIMILAR TO 'PPG-(\d|[A-Z]){1,3}' OR
    -- Trigramme RP correct ou NULL
    (ch_perseverant NOT SIMILAR TO '[A-Z]{3}' AND ch_perseverant IS NOT NULL) OR
    -- ID périmètre
    ch_per NOT SIMILAR TO 'PER-\d{3}' OR
    -- engagement gouv OK
    engagement_short NOT IN ('EMPLOI', 'TE', 'PROGRES', 'EMPLOI', 'ENGAG', 'TODO') OR
    -- saisie ATE vérification
    ch_saisie_ate NOT IN ('ATE', 'HORS_ATE_DECONCENTRE', 'HORS_ATE_CENTRALISE') OR
    -- Etat de publication du chantier
    ch_state NOT IN ('PUBLIE', 'BROUILLON', 'NON_PUBLIE') OR
    -- Zone-groupe applicable
    zg_applicable NOT SIMILAR TO 'ZG-\d{3}'
