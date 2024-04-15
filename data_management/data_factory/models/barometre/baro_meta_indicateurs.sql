select 
indic_id , 
null as indic_nom, coalesce(indic_nom_baro, indic_nom) as indic_nom_baro, 
null as indic_descr, coalesce(indic_descr_baro, indic_descr) as indic_descr_baro
from {{ ref('metadata_indicateurs') }} mi
