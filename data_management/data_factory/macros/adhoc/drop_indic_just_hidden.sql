-- Ce fragment permet de supprimer de la table metadata_indicateur
--  les indicateurs qui viennent d'être supprimés de metadata_indicateur_hidden.
--  En effet, metadata_indicateur est incremental. Donc si un ligne est supprimée dans metadata_indicateur_hidden,
--  alors elle ne va pas apparaitre comme ligne modifiée et ne sera donc pas supprimée dans metadata_indicateur.


-- DELETE JOIN impossible avec postgres donc DELETE USING
--  see: https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-delete-join/

{% macro drop_indic_just_hidden(par) %}

DELETE FROM 
    -- on va supprimer les lignes dans metadata_indicateurs -> old_table
	{{ par }} old_table USING
    -- jointure avec la table à jour: metadata_indicateurs_hidden -> latest
  	(SELECT indic_id, indic_hidden_pilote FROM {{ ref('metadata_indicateurs_hidden') }}) latest
-- jointure sur les indic_id
WHERE old_table.indic_id = latest.indic_id
  -- et on ne garde (pour suppression) que les lignes avec indic_hidden_pilote=TRUE
  AND latest.indic_hidden_pilote
  -- (optionnel) on retourne les lignes supprimées
  RETURNING old_table.indic_id, latest.indic_hidden_pilote




{% endmacro %}
