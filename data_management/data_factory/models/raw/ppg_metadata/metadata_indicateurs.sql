select * from {{ ref('metadata_indicateurs_hidden') }} where not coalesce(indic_hidden_pilote::boolean, false)
