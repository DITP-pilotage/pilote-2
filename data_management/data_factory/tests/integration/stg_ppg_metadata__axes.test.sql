-- depends_on: {{ ref('metadata_axes') }}

{{ config(tags=['unit-test']) }}

{% call dbt_unit_testing.test('stg_ppg_metadata__axes', 'Renommage des colonnes avec contenu identique') %}
  
  {% call dbt_unit_testing.mock_ref ('metadata_axes') %}
    axe_id,axe_short,axe_name,axe_desc
    'EMPLOI','Plein emploi 22','Atteindre le plein emploi et réindustrialiser le pays',null
    'TE','Transition écologique','Planifier et accélérer la transition écologique','some desc'

  {% endcall %}
  
  {% call dbt_unit_testing.expect({"input_format": "csv"}) %}
    id,nom_court,nom,description
    'EMPLOI','Plein emploi 22','Atteindre le plein emploi et réindustrialiser le pays',null
    'TE','Transition écologique','Planifier et accélérer la transition écologique','some desc'

  {% endcall %}
{% endcall %}

