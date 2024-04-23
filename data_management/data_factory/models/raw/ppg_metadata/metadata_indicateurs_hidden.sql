{{ config(pre_hook="{{drop_indic_hidden_temp_just_deleted(this)}}") }}

select * from {{ ref('metadata_indicateurs_hidden_temporaire') }}
