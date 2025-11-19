SELECT
    indicateur_territoire_valeur_evenement.id AS evenement_id,
    indicateur_territoire_valeur_evenement.indic_id,
    indicateur_territoire_valeur_evenement.territoire_code,
    indicateur_territoire_valeur_evenement.date_valeur,
    ta_indic.id AS ta_indic_id,
    ta_indic.taa_adate AS taux_avancement_jalon,
    ta_indic.tag AS taux_avancement_mandat
FROM
    {{ source('db_schema_public', 'indicateur_territoire_valeur_evenement') }}
        AS indicateur_territoire_valeur_evenement
LEFT OUTER JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
    ON indicateur_territoire_valeur_evenement.territoire_code = territoire.code
LEFT OUTER JOIN {{ ref('indicateur_identite') }} AS indicateur_identite
    ON indicateur_territoire_valeur_evenement.indic_id = indicateur_identite.id
LEFT OUTER JOIN {{ ref('indicateur_territoire') }} AS indicateur_territoire
    ON
        indicateur_identite.id = indicateur_territoire.id
        AND territoire.zone_id = indicateur_territoire.zone_id
LEFT OUTER JOIN {{ ref('compute_ta_indic') }} AS ta_indic
    ON
        indicateur_territoire_valeur_evenement.date_valeur::TEXT
        = ta_indic.metric_date
        AND territoire.zone_id = ta_indic.zone_id
        AND indicateur_territoire_valeur_evenement.indic_id = ta_indic.indic_id
WHERE
    indicateur_territoire_valeur_evenement.type_valeur = 'VALEUR_AVANCEMENT'
    AND NOT (
        (
            indicateur_identite.maille_nat_agregee
            AND indicateur_territoire_valeur_evenement.territoire_code LIKE 'NAT%' -- noqa: LT05
        )
        OR (
            indicateur_identite.maille_reg_agregee
            AND indicateur_territoire_valeur_evenement.territoire_code LIKE 'REG%' -- noqa: LT05
        )
    )
    AND indicateur_territoire.est_applicable
