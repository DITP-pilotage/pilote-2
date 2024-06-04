{{ config(materialized = 'table') }}

-- Cette table indique la prochaine date théorique de mise à jour des données
--	en fonction de la dernière date de màj + périodicité déclarée
--	pour chaque {indic, maille}

WITH 
-- Liste des indicateurs territo
src_indic_territo AS (
	SELECT indic_id, indic_territorialise AS indic_territo
	FROM {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} mic
	WHERE indic_territorialise
)
-- Liste des mailles pour un CROSS JOIN à suivre
, base_mailles as (
SELECT * FROM (values ('DEPT'), ('REG'), ('NAT')) AS a ("maille")
)
-- Base des indicateurs à étudier
-- 	+ date de la VA dispo la + récente
, src_indicateurs AS (
SELECT 
	spmi.id as indic_id, 
	i.chantier_id, 
	base_mailles.maille,
	max(last_vaca.date_valeur_actuelle::date) AS last_va_date,
	count(*) AS n
FROM base_mailles
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} spmi
LEFT JOIN {{ ref('get_last_vaca') }} as last_vaca ON last_vaca.indic_id = spmi.id
LEFT JOIN {{ ref('stg_ppg_metadata__indicateurs') }} i ON i.id =spmi.id
LEFT JOIN {{ ref('stg_ppg_metadata__chantiers') }} cchantier ON i.chantier_id =cchantier.id
LEFT JOIN src_indic_territo it ON last_vaca.indic_id =it.indic_id
WHERE 
(
	-- Pour DEPT: les indics territo des chantiers territo + pilotés au DEPT
	(base_mailles."maille"='DEPT' 	and cchantier.est_territorialise and it.indic_territo and maille_pilotage='DEPT') OR
	-- Pour REG: les indics territo des chantiers territo + 
	(base_mailles."maille"='REG' 	and cchantier.est_territorialise and it.indic_territo and maille_pilotage IN ('REG', 'DEPT')) OR
	-- Pour NAT: Tous les indics
	(base_mailles."maille"='NAT')
)
	-- On ne conserve que les chantiers publiés
	AND COALESCE(cchantier.statut::type_statut, 'PUBLIE')='PUBLIE'
GROUP BY spmi.id, base_mailles.maille, i.chantier_id 
ORDER BY spmi.id, base_mailles.maille)


-- Récupération de la configuration temporelle
, src_config_tempo AS (
SELECT 
	indic_id, periodicite, delai_disponibilite 
FROM {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} 
ORDER BY indic_id)

-- Calcul de la prochaine date de VA
, get_prochaine_date_va AS (
SELECT a.indic_id, a.chantier_id, a."maille", a.last_va_date,
b.periodicite, b.delai_disponibilite,
-- 	On ajouter X mois suivant la valeur de periodicite renseignée
CASE b.periodicite
        WHEN 'Mensuelle' 		THEN a.last_va_date + interval '1 month'
        WHEN 'Trimestrielle' 	THEN a.last_va_date + interval '3 months'
        WHEN 'Semestrielle' 	THEN a.last_va_date + interval '6 months'
        WHEN 'Annuelle' 		THEN a.last_va_date + interval '1 year'
		WHEN 'Bi-annuelle' 		THEN a.last_va_date + interval '2 year'
        WHEN '3 ans' 			THEN a.last_va_date + interval '3 year'
        WHEN '6 ans' 			THEN a.last_va_date + interval '6 year'
		ELSE NULL
    END AS prochaine_date_va
FROM src_indicateurs AS a
LEFT JOIN src_config_tempo AS b ON a.indic_id=b.indic_id
)

-- Calcul de la prochaine date de màj
--	prochaine_date_maj= prochaine_date_va+delai_disponibilite
, get_prochaine_date_maj AS (
SELECT *, 
	(prochaine_date_va+ delai_disponibilite * interval '1 month') AS prochaine_date_maj
FROM get_prochaine_date_va
)

-- Calcule si données à jour + distance à la prochaine màj (en jours)
, get_est_a_jour_et_date_maj_jours AS (
SELECT *, 
	coalesce(prochaine_date_maj > current_date, false) AS est_a_jour,
	extract(day FROM prochaine_date_maj - current_date) AS prochaine_date_maj_jours
FROM get_prochaine_date_maj
ORDER BY indic_id, "maille"
)

SELECT * FROM get_est_a_jour_et_date_maj_jours
