{{ config(schema = 'raw_data') }}

select 
    "chantier_id","maille","code_insee","date","type","contenu","auteur","meteo","date_meteo"
from {{ source('dlt_load_tmp', 'commentaires_py') }}
