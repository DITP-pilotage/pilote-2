-- depends_on: "dev_pilote__6230"."public"."chantier_territoire"



WITH
tous_jalons AS (
    SELECT
        chantier_id,
        zone_id,
        taa_courant_ch AS taux_avancement_annuel,
        date_ta as date_taux_avancement_annuel,
        jalon,
        taa_courant_eval_ch AS taux_avancement_annuel_eval
    FROM "dev_pilote__6230"."df3"."compute_ta_ch_jalon"
),
mediane_par_chantier_jalon AS (
    SELECT
        cj.chantier_id,
        z.zone_type AS maille,
        cj.jalon,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cj.taa_courant_ch) AS mediane
    FROM "dev_pilote__6230"."df3"."compute_ta_ch_jalon" AS cj
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."metadata_zones" AS z
        ON cj.zone_id = z.zone_id
    WHERE cj.taa_courant_ch IS NOT NULL AND z.zone_type <> 'NAT'
    GROUP BY cj.chantier_id, z.zone_type, cj.jalon
)

SELECT
    meta_ch.id,
    t.code AS territoire_code,
    t.maille,
    t.zone_id,
    t.code_insee,
    jalons_a_considerer.jalon,
    tous_jalons.taux_avancement_annuel AS taux_avancement,
    tous_jalons.date_taux_avancement_annuel::date as date_taux_avancement,
    tous_jalons.taux_avancement_annuel_eval AS taux_avancement_eval,
    ROUND(
        (
            tous_jalons.taux_avancement_annuel::numeric - mediane_par_chantier_jalon.mediane::numeric
        )::numeric,
        1
    ) AS ecart
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" AS meta_ch
CROSS JOIN "dev_pilote__6230"."public"."territoire" AS t
CROSS JOIN "dev_pilote__6230"."df3"."jalons_a_etudier" AS jalons_a_considerer
LEFT JOIN
    tous_jalons
    ON
        t.zone_id = tous_jalons.zone_id
        AND meta_ch.id = tous_jalons.chantier_id
        AND jalons_a_considerer.jalon = tous_jalons.jalon
LEFT JOIN
    mediane_par_chantier_jalon
    ON
        meta_ch.id = mediane_par_chantier_jalon.chantier_id
        AND UPPER(t.maille::text) = mediane_par_chantier_jalon.maille
        AND jalons_a_considerer.jalon = mediane_par_chantier_jalon.jalon