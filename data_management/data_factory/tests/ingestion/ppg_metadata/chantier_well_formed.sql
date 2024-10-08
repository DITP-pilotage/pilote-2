{{ config(
    enabled=true,
    tags="data_ingestion",
    severity = "error",
    store_failures = true,
    limit = 100,
    meta={"is_demo": "false"}
) }}

SELECT * FROM {{ ref('metadata_chantiers') }}
WHERE
    -- ID match regex 'CH-XXX'
    chantier_id NOT SIMILAR TO 'CH-\d\d\d'
    -- le chantier a un nom
    OR ch_nom IS NULL
    -- le dp n'est pas vide (meme si cette valeur n'est plus utilisée)
    OR ch_dp IS NULL
    -- ID PPG bien formé
    OR ch_ppg NOT SIMILAR TO 'PPG-(\d|[A-Z]){1,3}'
    -- Trigramme RP correct ou NULL
    OR (ch_perseverant NOT SIMILAR TO '[A-Z]{3}' AND ch_perseverant IS NOT NULL)
    -- ID périmètre
    OR ch_per NOT SIMILAR TO 'PER-\d{3}'
    -- engagement gouv OK
    OR engagement_short NOT IN (
        'EMPLOI', 'TE', 'PROGRES', 'EMPLOI', 'ENGAG', 'TODO'
    )
    -- saisie ATE vérification
    OR ch_saisie_ate NOT IN (
        'ATE', 'HORS_ATE_DECONCENTRE', 'HORS_ATE_CENTRALISE'
    )
    -- Etat de publication du chantier
    OR ch_state NOT IN ('PUBLIE', 'BROUILLON', 'NON_PUBLIE')
    -- Zone-groupe applicable
    OR zg_applicable NOT SIMILAR TO 'ZG-\d{3}'
    -- Mailles de réplication des données: REG->DEPT
    OR upper(replicate_val_reg_to) NOT IN ('DEPT')
    -- Mailles de réplication des données: NAT->REG ou NAT->DEPT
    OR upper(replicate_val_nat_to) NOT IN ('REG', 'DEPT')
