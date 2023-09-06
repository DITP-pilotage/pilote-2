WITH

commentaire_difficultes_rencontrees_et_risques_anticipes as (

    SELECT
        DISTINCT ON(dfakto_view.difficultes_rencontrees_et_risques_anticipes_date, projet_structurant_temporaire.id)
        gen_random_uuid () as id,
        projet_structurant_temporaire.id as projet_structurant_id,
        'difficultes_rencontrees_et_risques_anticipes' as type,
        dfakto_view.difficultes_rencontrees_et_risques_anticipes as contenu,
        dfakto_view.difficultes_rencontrees_et_risques_anticipes_date as date,
        NULL as auteur,
        false AS a_supprimer
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire
        ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
    WHERE difficultes_rencontrees_et_risques_anticipes IS NOT NULL
        AND difficultes_rencontrees_et_risques_anticipes_date IS NOT NULL

),

commentaire_dernieres_realisation_et_suivi_des_decisions as (

    SELECT
        DISTINCT ON(dfakto_view.dernieres_realisation_et_suivi_des_decisions_date, projet_structurant_temporaire.id)
        gen_random_uuid () as id,
        projet_structurant_temporaire.id as projet_structurant_id,
        'dernieres_realisation_et_suivi_des_decisions' as type,
        dfakto_view.dernieres_realisation_et_suivi_des_decisions as contenu,
        dfakto_view.dernieres_realisation_et_suivi_des_decisions_date as date,
        NULL as auteur,
        false AS a_supprimer
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire
        ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
    WHERE dernieres_realisation_et_suivi_des_decisions IS NOT NULL
        AND dernieres_realisation_et_suivi_des_decisions_date IS NOT NULL

),

commentaire_solutions_proposees_et_prochaines_etapes as (

    SELECT
        DISTINCT ON(dfakto_view.solutions_proposees_et_prochaines_etapes_date, projet_structurant_temporaire.id)
        gen_random_uuid () as id,
        projet_structurant_temporaire.id as projet_structurant_id,
        'solutions_proposees_et_prochaines_etapes' as type,
        dfakto_view.solutions_proposees_et_prochaines_etapes as contenu,
        dfakto_view.solutions_proposees_et_prochaines_etapes_date as date,
        NULL as auteur,
        false AS a_supprimer
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire
        ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
    WHERE solutions_proposees_et_prochaines_etapes IS NOT NULL
        AND solutions_proposees_et_prochaines_etapes_date IS NOT NULL

),

commentaire_partenariats_et_moyens_mobilises as (

    SELECT
        DISTINCT ON(dfakto_view.partenariats_et_moyens_mobilises_date, projet_structurant_temporaire.id)
        gen_random_uuid () as id,
        projet_structurant_temporaire.id as projet_structurant_id,
        'partenariats_et_moyens_mobilises' as type,
        dfakto_view.partenariats_et_moyens_mobilises as contenu,
        dfakto_view.partenariats_et_moyens_mobilises_date as date,
        NULL as auteur,
        false AS a_supprimer
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire
        ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
    WHERE partenariats_et_moyens_mobilises IS NOT NULL
        AND partenariats_et_moyens_mobilises_date IS NOT NULL

)

SELECT * FROM commentaire_difficultes_rencontrees_et_risques_anticipes
UNION ALL
SELECT * FROM commentaire_dernieres_realisation_et_suivi_des_decisions
UNION ALL
SELECT * FROM commentaire_solutions_proposees_et_prochaines_etapes
UNION ALL
SELECT * FROM commentaire_partenariats_et_moyens_mobilises
