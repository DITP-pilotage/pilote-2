{{ config(tags="scope_pst") }}

WITH toutes_les_dates as (
    (SELECT
            commentaire_projet_structurant.projet_structurant_id as id,
            MAX(date) as max_date
        FROM {{ ref('commentaire_projet_structurant') }} commentaire_projet_structurant
        GROUP BY projet_structurant_id
    )
    UNION
    (SELECT 
            objectif_projet_structurant.projet_structurant_id as id,
            MAX(date) as max_date
        FROM objectif_projet_structurant
        GROUP BY projet_structurant_id
    )
   UNION
    (SELECT 
            synthese_des_resultats_projet_structurant.projet_structurant_id as id,
            MAX(GREATEST(date_meteo, date_commentaire)) as max_date
        FROM synthese_des_resultats_projet_structurant
        GROUP BY projet_structurant_id
    )
),
max_date as (
    SELECT
        id,
        MAX(max_date) as max_date
        FROM toutes_les_dates
        GROUP BY id
)   

SELECT
    projet_structurant_temporaire.*,
    max_date.max_date as date_donnees_qualitative,
    false as a_supprimer
    FROM {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire
    LEFT JOIN max_date ON projet_structurant_temporaire.id = max_date.id
