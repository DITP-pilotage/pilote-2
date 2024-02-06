-- Ce fragment permet de supprimer de la table metadata_indicateurs_complementaire
--  les indicateurs qui viennent d'être supprimés de metadata_indicateurs_complementaire_temporaire (càd de view_meta_indicateur_complementaire).
--  En effet, metadata_indicateurs_complementaire est incremental. Donc si un ligne est supprimée dans metadata_indicateurs_complementaire_temporaire,
--  alors elle ne va pas apparaitre comme ligne modifiée et ne sera donc pas supprimée dans metadata_indicateurs_complementaire.

{% macro drop_indic_complementaire_just_deleted(table_) %}

-- on va supprimer les lignes dans metadata_indicateurs_complementaire
DELETE FROM {{ table_ }} 
-- si l'indicateur n'est pas dans metadata_indicateurs_complementaire_temporaire
WHERE indic_id NOT IN (
	SELECT indic_id FROM {{ ref('metadata_indicateurs_complementaire_temporaire') }}
)

{% endmacro %}
