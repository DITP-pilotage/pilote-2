SELECT
    DISTINCT ON (projet_structurant_code)
    {{ dbt_utils.surrogate_key(['projet_structurant_code']) }} as id,
    projet_structurant_code as code,
    projet_structurant_nom as nom,
    zone_code as territoire_code,
    ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = perimetre_ministeriel_1
        AND perimetre_ministeriel_1 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = perimetre_ministeriel_2
        AND perimetre_ministeriel_2 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = perimetre_ministeriel_3
        AND perimetre_ministeriel_3 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = perimetre_ministeriel_4
        AND perimetre_ministeriel_4 IS NOT NULL
    ) as perimetres_ids,
    ARRAY [direction_de_l_administration_porteuse_du_projet] as direction_administration,
    ARRAY [chefferie_de_projet] as chefferie_de_projet,
    ARRAY [co_porteur_du_projet] as co_porteurs
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }}
    ORDER BY projet_structurant_code
