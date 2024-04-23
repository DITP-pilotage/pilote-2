{{ config(pre_hook="{{drop_indic_just_hidden(this)}}") }}

select * from {{ source('parametrage_indicateurs', 'metadata_indicateurs_hidden') }} where not coalesce(indic_hidden_pilote::text::boolean, false)
