WITH 
-- Liste des indicateurs du baromètre
indic_baro AS 
( SELECT id FROM {{ ref('stg_ppg_metadata__indicateurs') }} WHERE est_barometre ),
-- Données des indicateurs du baromètre
donnees AS 
(
  SELECT
    i.*,
    t.zone_id,
    z.zone_type 
  FROM
    {{ ref('indicateur') }} i 
	-- On ne garde que les indicateurs au baromètres
    RIGHT JOIN indic_baro b ON i.id = b.id 
    -- pour: Ajout de la zone_id
	LEFT JOIN {{ source('db_schema_public', 'territoire') }} t ON i.territoire_code = t.code 
    -- pour: Ajout de la zone_type (maille)
    LEFT JOIN {{ ref('metadata_zones') }} z ON t.zone_id = z.zone_id
),

-- Données VA
export_va AS 
(
  SELECT
    id AS indic_id,
    zone_id AS enforce_zone_id,
    zone_type AS "maille",
	-- Unnest de l'array des valeurs des VA
    UNNEST(evolution_date_valeur_actuelle) AS metric_enforce_date,
	-- Unnest de l'array des dates des VA
    UNNEST(evolution_valeur_actuelle) AS indic_va 
  FROM donnees 
  -- On ne garde que les lignes où une VA est dispo
  WHERE evolution_valeur_actuelle IS NOT NULL 
),

-- Données VI
export_vi AS 
(
  SELECT
    id AS indic_id,
    zone_id AS enforce_zone_id,
    zone_type AS "maille",
    date_valeur_initiale AS metric_enforce_date,
	-- VI
    valeur_initiale AS indic_vi 
  FROM donnees 
  -- On ne garde que les lignes où une VI est dispo
  WHERE valeur_initiale IS NOT NULL 
),

-- Données VC
export_vc AS 
(
  SELECT
    id AS indic_id,
    zone_id AS enforce_zone_id,
    zone_type AS "maille",
    objectif_date_valeur_cible AS metric_enforce_date,
	-- VC
    objectif_valeur_cible AS indic_vc 
  FROM donnees 
  -- On ne garde que les lignes où une VC est dispo
  WHERE objectif_valeur_cible IS NOT NULL 
),

-- Données TA
export_ta AS 
(
  SELECT
    id AS indic_id,
    zone_id AS enforce_zone_id,
    zone_type AS "maille",
    date_valeur_actuelle AS metric_enforce_date,
    -- TA
    objectif_taux_avancement AS indic_ta 
  FROM donnees 
  -- On ne garde que les lignes où un TA est dispo
  WHERE objectif_taux_avancement IS NOT NULL 
),

-- Combinaison des VI,VA,VC,TA
merge_exports AS 
(
  SELECT
    COALESCE(a.indic_id, b.indic_id, c.indic_id, d.indic_id) AS indic_id,
    COALESCE(a.enforce_zone_id, b.enforce_zone_id, c.enforce_zone_id, d.enforce_zone_id) AS enforce_zone_id,
    COALESCE(a.maille, b.maille, c.maille, d.maille) AS maille,
    COALESCE(a.metric_enforce_date, b.metric_enforce_date, c.metric_enforce_date, d.metric_enforce_date) AS metric_enforce_date,
    a.indic_va,
    b.indic_vi,
    c.indic_vc,
    d.indic_ta 
  FROM
    export_va a 
    FULL JOIN export_vi b ON a.indic_id = b.indic_id AND a.enforce_zone_id = b.enforce_zone_id AND a.metric_enforce_date = b.metric_enforce_date 
    FULL JOIN export_vc c ON a.indic_id = c.indic_id AND a.enforce_zone_id = c.enforce_zone_id AND a.metric_enforce_date = c.metric_enforce_date 
    FULL JOIN export_ta d ON a.indic_id = d.indic_id AND a.enforce_zone_id = d.enforce_zone_id AND a.metric_enforce_date = d.metric_enforce_date 
)


SELECT * FROM merge_exports order by indic_id, maille, enforce_zone_id, metric_enforce_date
