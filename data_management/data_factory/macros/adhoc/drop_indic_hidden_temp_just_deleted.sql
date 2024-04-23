-- Ce fragment permet de supprimer de la table metadata_indicateurs_hidden
--  les indicateurs qui viennent d'être supprimés de metadata_indicateurs_hidden_temporaire (càd de view_meta_indicateur).
--  En effet, metadata_indicateurs_hidden est incremental. Donc si un ligne est supprimée dans metadata_indicateurs_hidden_temporaire,
--  alors elle ne va pas apparaitre comme ligne modifiée et ne sera donc pas supprimée dans metadata_indicateurs_hidden.

{% macro drop_indic_hidden_temp_just_deleted(table_) %}

-- on va supprimer les lignes dans metadata_indicateurs_hidden
DELETE FROM {{ table_ }} 
-- si l'indicateur n'est pas dans metadata_indicateurs_hidden_temporaire
WHERE indic_id NOT IN (
	SELECT indic_id FROM {{ ref('metadata_indicateurs_hidden_temporaire') }}
)

{% endmacro %}
