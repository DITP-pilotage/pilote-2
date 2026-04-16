

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

WITH current_year_vca AS (
    SELECT
        indic_id,
        zone_id,
        vca,
        vca_date
    FROM "dev_pilote__6230"."df3"."get_vca_jalon"
    WHERE jalon = DATE_PART('year', NOW())
)

SELECT
    pivot_mesures.id,
    pivot_mesures.date_import,
    pivot_mesures.indic_id,
    pivot_mesures.zone_id,
    pivot_mesures.metric_date,
    pivot_mesures.vi,
    pivot_mesures.va,
    pivot_mesures.vc,
    vaca.vaca,
    vacg.vacg,
    vacp.vacp,
    vacp.metric_date AS date_valeur_proposition,
    -- VCA pour l'année COURANTE (rule::620)
    current_year_vca.vca AS vca_courant,
    current_year_vca.vca_date AS vca_courant_date,
    -- VCA pour l'année de la pivot_mesures.metric_date
    -- (pas utilisé, mais valeur avant rule::620)
    vca_jalon.vca AS vca_adate,
    vca_jalon.vca_date AS vca_adate_date,
    get_vig.vig,
    get_vig.vig_date,
    get_vcg.vcg,
    get_vcg.vcg_date
FROM "dev_pilote__6230"."df3"."pivot_mesures" AS pivot_mesures
LEFT JOIN
    "dev_pilote__6230"."df3"."compute_vaca" AS vaca
    ON
        pivot_mesures.indic_id = vaca.indic_id
        AND pivot_mesures.zone_id = vaca.zone_id
        AND pivot_mesures.metric_date = vaca.metric_date
LEFT JOIN
    "dev_pilote__6230"."df3"."compute_vacg" AS vacg
    ON
        pivot_mesures.indic_id = vacg.indic_id
        AND pivot_mesures.zone_id = vacg.zone_id
        AND pivot_mesures.metric_date = vacg.metric_date
LEFT JOIN
    "dev_pilote__6230"."df3"."compute_vacp" AS vacp
    ON
        pivot_mesures.indic_id = vacp.indic_id
        AND pivot_mesures.zone_id = vacp.zone_id
-- La VCA ici est à l'année de la VA (année de pivot_mesures.metric_date)
LEFT JOIN
    "dev_pilote__6230"."df3"."get_vca_jalon" AS vca_jalon
    ON
        pivot_mesures.indic_id = vca_jalon.indic_id
        AND pivot_mesures.zone_id = vca_jalon.zone_id
        AND DATE_PART('year', pivot_mesures.metric_date) = vca_jalon.jalon
-- La VCA ici est en date de l'année courante
LEFT JOIN
    current_year_vca
    ON
        pivot_mesures.indic_id = current_year_vca.indic_id
        AND pivot_mesures.zone_id = current_year_vca.zone_id
LEFT JOIN
    "dev_pilote__6230"."df3"."get_vig" AS get_vig
    ON
        pivot_mesures.indic_id = get_vig.indic_id
        AND pivot_mesures.zone_id = get_vig.zone_id
LEFT JOIN
    "dev_pilote__6230"."df3"."get_vcg" AS get_vcg
    ON
        pivot_mesures.indic_id = get_vcg.indic_id
        AND pivot_mesures.zone_id = get_vcg.zone_id