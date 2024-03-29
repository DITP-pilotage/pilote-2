{{ config(materialized='table') }}

with 
-- Table des synthèses triée par date
synthese_triee_par_date as (
    SELECT ROW_NUMBER() OVER (PARTITION BY chantier_id, code_insee, maille ORDER BY date_meteo DESC) AS row_id_by_date_meteo_desc,
        chantier_id,
        code_insee,
        maille,
        meteo,
        date_meteo
    FROM {{ source('db_schema_public', 'synthese_des_resultats') }}
),
chantier_est_barometre as (
    SELECT m_indicateurs.chantier_id,
        bool_or(m_indicateurs.est_barometre) as est_barometre
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
    GROUP BY m_indicateurs.chantier_id
),
indicateurs_zones AS (
	SELECT DISTINCT
        spmi.id as indic_id,
        chantier_id, 
        zones.id as zone_id 
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} spmi
	CROSS JOIN (
        SELECT DISTINCT
            id
        FROM {{ ref('stg_ppg_metadata__zones') }}
        ) as zones 
),
indicateurs_zones_applicables AS (
	SELECT DISTINCT
        iz.indic_id,
        iz.chantier_id,
        iz.zone_id,
        COALESCE(iiza.est_applicable, TRUE) AS est_applicable 
    FROM indicateurs_zones iz
	LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} iiza 
    ON iz.indic_id = iiza.indic_id AND iz.zone_id = iiza.zone_id
),
chantiers_zones_applicables AS (
    SELECT 
        chantier_id,
        zone_id,
        bool_or(est_applicable) as est_applicable
    FROM indicateurs_zones_applicables 
    GROUP BY chantier_id, zone_id
),
-- Indique pour chaque chantier s'il existe un TA à chaque maille
ch_maille_has_ta_pivot_clean as (
select a.chantier_id,
	bool_or(tag_ch is not null) filter (where z.zone_type='DEPT') as has_ta_dept,
	bool_or(tag_ch is not null) filter (where z.zone_type='REG') as has_ta_reg,
	bool_or(tag_ch is not null) filter (where z.zone_type='NAT') as has_ta_nat
from {{ ref('compute_ta_ch') }} a
left join {{ source('db_schema_public', 'territoire') }} t on a.territoire_code =t.code
left join {{ ref('metadata_zones') }} z on t.zone_id=z.zone_id
group by chantier_id 
),
-- Indique pour chaque chantier s'il existe une météo à chaque maille
ch_has_meteo as (
select a.chantier_id,
	bool_or(meteo is not null) filter (where a.maille='DEPT') as has_meteo_dept,
	bool_or(meteo is not null) filter (where a.maille='REG') as has_meteo_reg,
	bool_or(meteo is not null) filter (where a.maille='NAT') as has_meteo_nat
from synthese_triee_par_date a
group by chantier_id 
),

-- On récupère les directeurs des directions porteuses de chaque chantier
ch_unnest_porteurs_dac as (
select chantier_id, unnest(string_to_array("porteur_ids_DAC", ' | ')) as pi from {{ ref('metadata_chantiers') }} mc 
), ch_unnest_porteurs_dac_pnames as (
select a.*, mp.porteur_directeur, mp.porteur_short from ch_unnest_porteurs_dac a
left join {{ ref('metadata_porteurs') }} mp on a.pi=mp.porteur_id 
),
ch_unnest_porteurs_dac_pnames_agg as (
select 
	chantier_id, 
	array_agg(pi) p_id, 
	array_agg(porteur_directeur) p_directeurs,
	array_agg(porteur_short) p_shorts 
	from ch_unnest_porteurs_dac_pnames
group by chantier_id
),
mailles_applicables as (
    SELECT 
        id AS chantier_id, 
        unnest(coalesce(maille_applicable, '{NAT,DEPT,REG}')) AS maille_applicable,
        true AS maille_est_applicable
    FROM 
        raw_data.stg_ppg_metadata__chantiers mc 
)


select 
    mc.chantier_id as id,
    ch_nom as nom,
    t.code_insee as code_insee,
    ta_ch_today.tag_ch as taux_avancement,
    ta_ch_today.taa_courant_ch as taux_avancement_annuel,
    ta_ch_prev_month.tag_ch as taux_avancement_precedent,
    t.nom as territoire_nom,
    string_to_array(ch_per, ' | ') as perimetre_ids, 
    z.zone_type as "maille",
    -- coalesce with empty array
    coalesce(p_names.p_directeurs, string_to_array('','')) as directeurs_administration_centrale, 
    string_to_array("porteur_ids_noDAC" , ' | ') as ministeres,
    string_to_array("porteur_shorts_noDAC" , ' | ') as ministeres_acronymes,
    -- coalesce with empty array
    coalesce(p_names.p_shorts, string_to_array('','')) as directions_administration_centrale, 
    dir_projets.nom as directeurs_projet,
    resp_locaux.nom as responsables_locaux,
    ref_territoriaux.nom as referents_territoriaux,
    sr.meteo as meteo,
    ax.axe_name as axe,
    ppg.ppg_nom as ppg,
    dir_projets.email as directeurs_projet_mails,
    resp_locaux.email as responsables_locaux_mails,
    ref_territoriaux.email as referents_territoriaux_mails,
    chantier_est_barometre.est_barometre,
    mc.ch_territo as est_territorialise,
    t.code as territoire_code,
	LOWER(mc.ch_saisie_ate)::type_ate as ate,
    COALESCE(ch_state::type_statut, 'PUBLIE') as statut,
    has_ta.has_ta_dept as a_taux_avancement_departemental,
    has_ta.has_ta_reg as a_taux_avancement_regional,
    ch_has_meteo.has_meteo_dept as a_meteo_departemental,
    ch_has_meteo.has_meteo_reg as a_meteo_regional,
    COALESCE (chantier_za.zone_est_applicable, true) AND COALESCE (mailles_applicables.maille_est_applicable, false) AS est_applicable,
    false as a_supprimer
from {{ ref('metadata_chantiers') }} mc
-- On dupplique les lignes chantier pour chaque territoire
cross join {{ source('db_schema_public', 'territoire') }} t
left join {{ ref('int_directeurs_projets')}} dir_projets on dir_projets.chantier_id = mc.chantier_id
left join {{ ref('int_responsables_locaux')}} resp_locaux on resp_locaux.chantier_id = mc.chantier_id and resp_locaux.territoire_code = t.code
left join {{ ref('int_referents_territoriaux')}} ref_territoriaux on ref_territoriaux.territoire_code = t.code
left join {{ ref('metadata_zones') }} z on z.zone_id=t.zone_id
left join {{ ref('metadata_porteurs') }} po on mc."porteur_ids_DAC"=po.porteur_id
left join ch_unnest_porteurs_dac_pnames_agg p_names on mc.chantier_id=p_names.chantier_id
left join 
    (select * from synthese_triee_par_date where row_id_by_date_meteo_desc=1) sr
	    ON sr.chantier_id =mc.chantier_id AND
	    sr.maille = z.zone_type AND
	    sr.code_insee = t.code_insee
left join {{ ref('metadata_ppgs') }} ppg on mc.ch_ppg =ppg.ppg_id
left join {{ ref('metadata_axes') }} ax on ppg.ppg_axe =ax.axe_id
LEFT JOIN chantier_est_barometre on mc.chantier_id = chantier_est_barometre.chantier_id
left join ch_maille_has_ta_pivot_clean as has_ta on has_ta.chantier_id=mc.chantier_id
left join ch_has_meteo on ch_has_meteo.chantier_id=mc.chantier_id 
left join 
	(select * from {{ ref('compute_ta_ch') }} where valid_on='today') as ta_ch_today on ta_ch_today.chantier_id=mc.chantier_id and ta_ch_today.zone_id=z.zone_id 
left join 
	(select * from {{ ref('compute_ta_ch') }} where valid_on='prev_month') as ta_ch_prev_month on ta_ch_prev_month.chantier_id=mc.chantier_id and ta_ch_prev_month.zone_id=z.zone_id
LEFT JOIN mailles_applicables ON mailles_applicables.chantier_id = mc.chantier_id AND mailles_applicables.maille_applicable = z.zone_type
LEFT JOIN {{ ref('int_chantiers_zone_applicables')}} chantier_za ON chantier_za.chantier_id = mc.chantier_id AND chantier_za.zone_id = z.zone_id
order by mc.chantier_id, t.zone_id


