{{ config(materialized='table') }}

-- TODO: implement
SELECT * FROM {{ ref('chantier') }}