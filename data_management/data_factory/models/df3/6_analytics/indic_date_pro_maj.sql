{{ config(materialized = 'table') }}

-- Cette table indique la prochaine date théorique de mise à jour des données
--	en fonction de la dernière date de màj + périodicité déclarée
--	pour chaque {indic, maille}

WITH 
-- Liste des chantiers territorialisés
src_ch_territo AS (
	SELECT chantier_id, ch_territo FROM raw_data.metadata_chantiers WHERE ch_territo
	ORDER BY chantier_id
)
-- Liste des indicateurs territo (via Trello)
, src_indic_territo AS (
	SELECT indic_id, indic_territorialise AS indic_territo
	FROM raw_data.metadata_indicateurs_complementaire mic
	WHERE indic_territorialise
)
-- Base des indicateurs à étudier
-- 	+ date de la VA dispo la + récente
, src_indicateurs AS (
SELECT 
	i.id as indic_id, i.chantier_id, maille,
	max(date_valeur_actuelle) AS last_va_date,
	count(*) AS n
FROM public.indicateur i 
LEFT JOIN raw_data.metadata_chantiers c ON i.chantier_id =c.chantier_id
LEFT JOIN src_indic_territo it ON i.id =it.indic_id
WHERE 
-- Uniquement les chantiers territorialisés
c.ch_territo AND
-- Uniquement les indicateurs territorialisés
it.indic_territo
GROUP BY id, maille, i.chantier_id 
ORDER BY id, maille)


-- Récupération de la configuration temporelle
, src_config_tempo AS (
SELECT 
	indic_id, periodicite, delai_disponibilite 
FROM raw_data.metadata_indicateurs_complementaire 
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
