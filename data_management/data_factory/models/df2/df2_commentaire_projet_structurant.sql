{{ config(tags="scope_pst") }}

-- TODO: implement
SELECT * FROM {{ ref('commentaire_projet_structurant') }}