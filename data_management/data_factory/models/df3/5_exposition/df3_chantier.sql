select 
    chantier_id as id,
    ch_nom as nom,
    'todo' as code_insee,
    -1 as taux_avancement,
    'todo' as territoire_nom,
    string_to_array(ch_per, ' | ') as perimetre_ids, 
    'todo' as "maille",
    'todo' as directeurs_administration_centrale,
    string_to_array("porteur_ids_noDAC" , ' | ') as ministeres, 
    string_to_array("porteur_shorts_DAC" , ' | ') as directions_administration_centrale, 
    string_to_array("ch_dp" , ' | ') as directeurs_projet,
    'todo' as meteo,
    'todo' as axe,
    'todo'as ppg,
    string_to_array("ch_dp_mail" , ' | ') as directeurs_projet_mails,
    'todo' as est_barometre,
    'todo' as est_territorialise,
    'todo' as taux_avancement_precedent,
    'todo' as ate,
    'todo' as a_taux_avancement_departemental,
    'todo' as a_meteo_departemental,
    'todo' as a_meteo_regional,
    'todo' as a_taux_avancement_regional,
    false as a_supprimer,
    'todo' as est_applicable
from {{ ref('metadata_chantiers') }} mc 
