-- Use data currently in the db to build this model
SELECT * FROM {{ source('db_prod', 'commentaire_projet_structurant') }}
