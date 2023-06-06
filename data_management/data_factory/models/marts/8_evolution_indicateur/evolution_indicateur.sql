WITH valeurs_actuelles_ordonnees_par_date_de_releve AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, date_releve ORDER BY date_releve ASC) AS row_id,
        *
    FROM {{ ref("pivot_faits_indicateur_avec_valeur_actuelle_comparable")}}
    WHERE valeur_actuelle_comparable_globale IS NOT NULL
)

SELECT indicateur_id,
    zone_id,
    array_agg(valeur_actuelle_comparable_globale) AS evolution_valeur_actuelle,
    array_agg(date_releve) AS evolution_date_valeur_actuelle
FROM valeurs_actuelles_ordonnees_par_date_de_releve
WHERE row_id = 1
GROUP BY indicateur_id, zone_id
