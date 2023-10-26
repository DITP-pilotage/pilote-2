{{config(materialized = 'view')}}


-- On ne va garder que les indicateurs qui ne sont PAS masqués
--  en faisant la jointure avec la liste des indicateurs non masqués
SELECT a.* FROM {{ ref('indicateur_hidden') }} a
INNER JOIN {{ ref('metadata_indicateurs') }} b
ON a.id=b.indic_id
