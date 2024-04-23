{{ config(pre_hook="{{drop_indic_complementaire_just_deleted(this)}}") }}

SELECT * FROM {{ ref('metadata_indicateurs_complementaire_temporaire') }}
