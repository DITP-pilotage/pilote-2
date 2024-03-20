-- depends_on: {{ ref('metadata_axes') }}

{{ config(tags=['unit-test']) }}

{% call dbt_unit_testing.test('stg_ppg_metadata__axes', 'should rename correctly') %}
  
  {% call dbt_unit_testing.mock_ref ('metadata_axes') %}
    select 'EMPLOI' as axe_id , 'Plein emploi 22' as axe_short, 'Atteindre le plein emploi et réindustrialiser le pays' as axe_name, null as axe_desc
    UNION ALL
    select 'TE' as axe_id , 'Transition écologique' as axe_short, 'Planifier et accélérer la transition écologique' as axe_name, 'some desc' as axe_desc

  {% endcall %}
  
  {% call dbt_unit_testing.expect() %}
    select 'EMPLOI' as id , 'Plein emploi 22' as nom_court, 'Atteindre le plein emploi et réindustrialiser le pays' as nom, null as description
    UNION ALL
    select 'TE' as id , 'Transition écologique' as nom_court, 'Planifier et accélérer la transition écologique' as nom, 'some desc' as description

  {% endcall %}
{% endcall %}
