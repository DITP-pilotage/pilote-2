{{ config(pre_hook="{{drop_indic_just_hidden(this)}}") }}

select * from {{ source('import_from_files', 'metadata_indicateurs_hidden') }} where not coalesce(indic_hidden_pilote::text::boolean, false)
