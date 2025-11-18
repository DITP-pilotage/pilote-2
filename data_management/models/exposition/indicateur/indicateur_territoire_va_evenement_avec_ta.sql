SELECT
    itve.id,
    itve.indic_id,
    itve.territoire_code,
    itve.date_valeur,
    ta_indic.id AS ta_indic_id,
    ta_indic.taa_adate,
    ta_indic.tag
FROM
    {{ source('db_schema_public', 'indicateur_territoire_valeur_evenement') }}
        AS itve
LEFT OUTER JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
    ON itve.territoire_code = territoire.code
LEFT OUTER JOIN {{ ref('indicateur_identite') }} AS indic
    ON itve.indic_id = indic.id
LEFT OUTER JOIN {{ ref('indicateur_territoire') }} AS indic_territoire
    ON
        indic.id = indic_territoire.id
        AND territoire.zone_id = indic_territoire.zone_id
LEFT OUTER JOIN {{ ref('compute_ta_indic') }} AS ta_indic
    ON
        itve.date_valeur::TEXT = ta_indic.metric_date
        AND territoire.zone_id = ta_indic.zone_id
        AND itve.indic_id = ta_indic.indic_id
WHERE
    itve.type_valeur = 'VALEUR_AVANCEMENT'
    AND NOT (
        (indic.maille_nat_agregee AND itve.territoire_code LIKE 'NAT%')
        OR (indic.maille_reg_agregee AND itve.territoire_code LIKE 'REG%')
    )
    AND indic_territoire.est_applicable
