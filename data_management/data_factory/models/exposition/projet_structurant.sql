SELECT
    {{ dbt_utils.surrogate_key(['projet_structurant_code',
    'projet_structurant_nom']) }} as id,
    projet_structurant_code as code,
    projet_structurant_nom as nom,
    direction_de_l_administration_porteuse_du_projet as direction_administration,
    ARRAY [perimetre_ministeriel_1, perimetre_ministeriel_2, perimetre_ministeriel_3, perimetre_ministeriel_4] as ministeres,
    chefferie_de_projet as chefferie_de_projet,
    co_porteur_du_projet as co_porteur
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }}