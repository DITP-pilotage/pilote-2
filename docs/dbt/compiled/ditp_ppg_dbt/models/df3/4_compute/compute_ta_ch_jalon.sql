

WITH
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic AS (
    SELECT
        ta_indic_jalon.indic_id,
        ta_indic_jalon.jalon,
        ta_indic_jalon.zone_id,
        ta_indic_jalon.vig,
        ta_indic_jalon.vcg,
        ta_indic_jalon.vca_date AS date_valeur_cible,
        ta_indic_jalon.taa AS taux_avancement,
        ta_indic_jalon.vca AS valeur_cible,
        ta_indic_jalon.taa_proposition AS taux_avancement_proposition,
        ta_indic_jalon.date_vaca AS date_valeur_actuelle,
        ta_indic_jalon.vaca AS valeur_actuelle,
        indic.chantier_id
    FROM "dev_pilote__6230"."df3"."compute_ta_indic_jalon" AS ta_indic_jalon
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS indic
        ON ta_indic_jalon.indic_id = indic.id
),

-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond AS (
    SELECT
        ta_zone_indic.indic_id,
        ta_zone_indic.jalon,
        ta_zone_indic.zone_id,
        ta_zone_indic.vig,
        ta_zone_indic.vcg,
        ta_zone_indic.date_valeur_cible,
        ta_zone_indic.taux_avancement,
        ta_zone_indic.valeur_cible,
        ta_zone_indic.taux_avancement_proposition,
        ta_zone_indic.date_valeur_actuelle,
        ta_zone_indic.valeur_actuelle,
        ponderation.chantier_id,
        ponderation.poids_zone_reel,
        ponderation.poids_eval_zone_reel,
        ta_zone_indic.taux_avancement
        * 0.01
        * ponderation.poids_zone_reel AS taux_avancement_pond,
        ta_zone_indic.taux_avancement
        * 0.01
        * ponderation.poids_eval_zone_reel AS taux_avancement_eval_pond
    FROM ta_zone_indic
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_ponderation_reelle" AS ponderation
        ON
            ta_zone_indic.indic_id = ponderation.indic_id
            AND ta_zone_indic.zone_id = ponderation.zone_id
    ORDER BY
        ta_zone_indic.chantier_id,
        ta_zone_indic.zone_id,
        ta_zone_indic.indic_id,
        ta_zone_indic.jalon
),

-- Calcul du TA chantier intermediaire
-- car sans prendre en compte le nb de TA indic remontés pour ce CH (PIL-227)
ta_ch_int AS (
    SELECT
        chantier_id,
        zone_id,
        jalon,
        -- Nombre de TA indicateurs remontés pour ce {chantier-zone}
        COUNT(indic_id) AS n_indic_in_ta,
        ARRAY_AGG(indic_id) AS indic_ids,
        ARRAY_AGG(poids_zone_reel) AS p_zone_reel,
        ARRAY_AGG(valeur_actuelle) AS valeur_actuelle_agg,
        ARRAY_AGG(vig) AS vig_agg,
        ARRAY_AGG(valeur_cible) AS valeur_cible_agg,
        ARRAY_AGG(date_valeur_cible) AS date_valeur_cible_agg,
        ARRAY_AGG(vcg) AS vcg_agg,
        ARRAY_AGG(taux_avancement) AS taux_avancement_agg,
        ARRAY_AGG(taux_avancement_pond) AS taux_avancement_pond_agg,
        -- Calcul du TA par somme des TA pondérés et bornage dans [0,100]
        CASE
            WHEN BOOL_OR(taux_avancement_pond IS NULL) THEN NULL
            ELSE ROUND(
                LEAST(
                    GREATEST(
                        SUM(taux_avancement_pond)::NUMERIC,
                        0
                    ),
                    100
                ),
                3
            )
        END AS taa_courant_ch_int,
        -- (PIL-253) Date du TA= date la plus tardive des VA indic du chantier
        -- TODO delete ?
        MAX(date_valeur_actuelle) AS derniere_date_va_indics_du_chantier
    FROM ta_zone_indic_pond
    -- On ne considère que les TA dont les indics ont une pond réelle > 0
    -- pr le calcul du TA chantier (ie la somme des TA indics pondérés)
    WHERE poids_zone_reel > 0
    GROUP BY
        chantier_id,
        zone_id,
        jalon
),

ta_ch_int_eval AS (
    SELECT
        chantier_id,
        zone_id,
        jalon,
        COUNT(indic_id) AS n_indic_in_ta,
        CASE
            WHEN BOOL_OR(
                taux_avancement_eval_pond IS NULL
            ) THEN NULL
            WHEN SUM(taux_avancement_eval_pond) > 100 THEN 100
            WHEN SUM(taux_avancement_eval_pond) < 0 THEN 0
            ELSE ROUND(
                SUM(taux_avancement_eval_pond)::NUMERIC,
                3
            )
        END AS taa_courant_eval_ch_int
    FROM ta_zone_indic_pond
    WHERE
        poids_eval_zone_reel > 0
    GROUP BY
        chantier_id,
        zone_id,
        jalon
),

-- Ajout du nb d'indics attendus pr chaque {chantier-zone}: 
-- n_indic_in_ta_expected
ta_ch_no_date AS (
    SELECT
        ta_ch_int.*,
        n_indic_in_ta_expected.n_indic_in_ta_expected,
        -- (PIL-227) Ici, on va vérifier pr chaque {zone-chantier}
        -- que l'on a bien combiné le nombre de TA indic que l'on attendait.
        -- On compare le nombre de TA indic combiné avec
        -- le nombre d'indics ayant une pondération non vide
        CASE
            WHEN
                ta_ch_int.n_indic_in_ta
                = n_indic_in_ta_expected.n_indic_in_ta_expected
                THEN ta_ch_int.taa_courant_ch_int
        END AS taa_courant_ch
    FROM ta_ch_int
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_n_indic_in_ta_expected" AS n_indic_in_ta_expected
        ON
            ta_ch_int.chantier_id = n_indic_in_ta_expected.chantier_id
            AND ta_ch_int.zone_id = n_indic_in_ta_expected.zone_id
),

ta_ch_no_date_eval AS (
    SELECT
        ta_ch_int_eval.chantier_id,
        ta_ch_int_eval.zone_id,
        ta_ch_int_eval.jalon,
        CASE
            WHEN
                ta_ch_int_eval.n_indic_in_ta
                = n_indic_in_ta_eval_expected.n_indic_in_ta_expected
                THEN ta_ch_int_eval.taa_courant_eval_ch_int
        END AS taa_courant_eval_ch
    FROM ta_ch_int_eval
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_n_indic_in_ta_eval_expected"
            AS n_indic_in_ta_eval_expected
        ON
            ta_ch_int_eval.chantier_id = n_indic_in_ta_eval_expected.chantier_id
            AND ta_ch_int_eval.zone_id = n_indic_in_ta_eval_expected.zone_id
)

-- On ajuste la date du TA.
--Si pas de TAA chantier => date_ta = NULL,
-- sinon date_ta = derniere_date_va_indics_du_chantier
SELECT
    ta_ch_no_date.*,
    CASE
        WHEN ta_ch_no_date.taa_courant_ch IS NULL THEN NULL
        ELSE ta_ch_no_date.derniere_date_va_indics_du_chantier
    END AS date_ta,
    ta_ch_no_date_eval.taa_courant_eval_ch
FROM
    ta_ch_no_date
LEFT JOIN ta_ch_no_date_eval ON
    ta_ch_no_date.chantier_id = ta_ch_no_date_eval.chantier_id
    AND ta_ch_no_date.zone_id = ta_ch_no_date_eval.zone_id
    AND ta_ch_no_date.jalon = ta_ch_no_date_eval.jalon