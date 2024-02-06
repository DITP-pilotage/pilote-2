-- Ce fragment permet de supprimer de la table metadata_indicateur
--  les indicateurs qui viennent d'être supprimés de metadata_indicateur_hidden.
--  En effet, metadata_indicateur est incremental. Donc si un ligne est supprimée dans metadata_indicateur_hidden,
--  alors elle ne va pas apparaitre comme ligne modifiée et ne sera donc pas supprimée dans metadata_indicateur.

{% macro drop_indic_just_hidden(table_) %}

-- on va supprimer les lignes dans metadata_indicateurs
DELETE FROM {{ table_ }} 
WHERE indic_id IN (
	SELECT indic_id FROM {{ ref('metadata_indicateurs_hidden') }}
  -- si indic_hidden_pilote est à supprimer
	WHERE indic_hidden_pilote = TRUE
)

{% endmacro %}
