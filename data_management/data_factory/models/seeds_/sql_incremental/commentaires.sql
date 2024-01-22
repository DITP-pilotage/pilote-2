{{ config(schema = 'raw_data') }}

select 
    chantier_id,"type",contenu,"date",auteur,maille,code_insee
from {{ ref('commentaires_py') }}
