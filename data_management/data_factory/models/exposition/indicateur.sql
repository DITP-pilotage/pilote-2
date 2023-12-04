{{config(materialized = 'view')}}

SELECT * from {{ ref('df1_indicateur') }}