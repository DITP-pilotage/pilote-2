

WITH
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic AS (
    SELECT
        a.indic_id,
        a.jalon,
        a.zone_id,
        a.vig,
        a.vcg,
        a.vca_date AS date_valeur_cible,
        a.taa AS taux_avancement,
        a.vca AS valeur_cible,
        a.taa_proposition AS taux_avancement_proposition,
        a.date_vaca AS date_valeur_actuelle,
        a.vaca AS valeur_actuelle,
        b.chantier_id
    FROM "dev_pilote__6230"."df3"."compute_ta_indic_jalon" AS a
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS b
        ON a.indic_id = b.id
),

-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond AS (
    SELECT
        a.indic_id,
        a.jalon,
        a.zone_id,
        a.vig,
        a.vcg,
        a.date_valeur_cible,
        a.taux_avancement,
        a.valeur_cible,
        a.taux_avancement_proposition,
        a.date_valeur_actuelle,
        a.valeur_actuelle,
        b.chantier_id,
        b.poids_zone_reel,
        b.poids_eval_zone_reel,
        taux_avancement * 0.01 * b.poids_zone_reel AS taux_avancement_pond,
        taux_avancement * 0.01 * b.poids_eval_zone_reel AS taux_avancement_eval_pond
    FROM ta_zone_indic AS a
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_ponderation_reelle" AS b
        ON a.indic_id = b.indic_id AND a.zone_id = b.zone_id
    ORDER BY chantier_id, zone_id, indic_id, jalon
),

-- Calcul du TA chantier intermediaire
--		car sans prendre en compte le nombre de TA indic remontés pour ce CH (PIL-227)
ta_ch_int AS (
    SELECT
        a.chantier_id,
        a.zone_id,
        a.jalon,
        -- Nombre de TA indicateurs remontés pour ce {chantier-zone}
        count(a.indic_id) AS n_indic_in_ta,
        array_agg(a.indic_id) AS indic_ids,
        array_agg(a.poids_zone_reel) AS p_zone_reel,
        array_agg(a.valeur_actuelle) AS valeur_actuelle_agg,
        array_agg(a.vig) AS vig_agg,
        array_agg(a.valeur_cible) AS valeur_cible_agg,
        array_agg(a.date_valeur_cible) AS date_valeur_cible_agg,
        array_agg(a.vcg) AS vcg_agg,
        array_agg(a.taux_avancement) AS taux_avancement_agg,
        array_agg(a.taux_avancement_pond) AS taux_avancement_pond_agg,
        -- Calcul du TA par somme des TA pondérés et bornage dans [0,100] (+handle null)
        CASE
            WHEN bool_or(
                a.taux_avancement_pond IS null
            ) THEN null
            WHEN sum(a.taux_avancement_pond) > 100 THEN 100
            WHEN sum(a.taux_avancement_pond) < 0 THEN 0
            ELSE round(
                sum(a.taux_avancement_pond)::numeric,
                3
            )
        END AS taa_courant_ch_int,
        -- (PIL-253) Date du TA= date la plus tardive des VA indic du chantier
        -- TODO delete ?
        max(a.date_valeur_actuelle) AS derniere_date_va_indics_du_chantier
    FROM (
            -- On ne considère que les TA dont les indicateurs ont une pondération réelle > 0
            -- 	pour le calcul du TA chantier (ie la somme des TA indicateurs pondérés)
            SELECT *
            FROM ta_zone_indic_pond
            WHERE
                poids_zone_reel > 0
        ) AS a
    GROUP BY
        a.chantier_id,
        a.zone_id,
        a.jalon
),
ta_ch_int_eval AS (
    SELECT
        a.chantier_id,
        a.zone_id,
        a.jalon,
        count(a.indic_id) AS n_indic_in_ta,
        CASE
            WHEN bool_or(
                a.taux_avancement_eval_pond IS null
            ) THEN null
            WHEN sum(a.taux_avancement_eval_pond) > 100 THEN 100
            WHEN sum(a.taux_avancement_eval_pond) < 0 THEN 0
            ELSE round(
                sum(a.taux_avancement_eval_pond)::numeric,
                3
            )
        END AS taa_courant_eval_ch_int
    FROM (
            SELECT *
            FROM ta_zone_indic_pond
            WHERE
                poids_eval_zone_reel > 0
        ) AS a
    GROUP BY
        a.chantier_id,
        a.zone_id,
        a.jalon
),

-- Ajout du nombre d'indics attendus pour chaque {chantier-zone}: n_indic_in_ta_expected
ta_ch_no_date AS (
    SELECT
        a.*,
        b.n_indic_in_ta_expected,
        -- (PIL-227) Ici, on va vérifier pour chaque {zone-chantier} que l'on a bien combiné le nombre de TA indic que l'on attendait.
        --		On compare le nombre de TA indic combiné, avec le nombre d'indics ayant une pondération non vide
        CASE
            WHEN
                n_indic_in_ta = b.n_indic_in_ta_expected
                THEN taa_courant_ch_int
        END AS taa_courant_ch
    FROM ta_ch_int AS a
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_n_indic_in_ta_expected" AS b
        ON a.chantier_id = b.chantier_id AND a.zone_id = b.zone_id
),
ta_ch_no_date_eval AS (
    SELECT
        ta_ch_int_eval.chantier_id,
        ta_ch_int_eval.zone_id,
        ta_ch_int_eval.jalon,
        CASE
            WHEN
                n_indic_in_ta = b.n_indic_in_ta_expected
                THEN taa_courant_eval_ch_int
        END AS taa_courant_eval_ch
    FROM ta_ch_int_eval
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_n_indic_in_ta_eval_expected" AS b
        ON ta_ch_int_eval.chantier_id = b.chantier_id AND ta_ch_int_eval.zone_id = b.zone_id
),

-- On ajuste la date du TA.
--	Si pas de TAA chantier => date_ta = NULL, sinon date_ta = derniere_date_va_indics_du_chantier
ta_ch AS (
    SELECT
        ta_ch_no_date.*,
        CASE
            WHEN taa_courant_ch IS null THEN null
            ELSE derniere_date_va_indics_du_chantier
        END AS date_ta,
        ta_ch_no_date_eval.taa_courant_eval_ch
    FROM
        ta_ch_no_date
        LEFT JOIN ta_ch_no_date_eval ON ta_ch_no_date.chantier_id = ta_ch_no_date_eval.chantier_id
        AND ta_ch_no_date.zone_id = ta_ch_no_date_eval.zone_id
        AND ta_ch_no_date.jalon = ta_ch_no_date_eval.jalon
)

SELECT * FROM ta_ch