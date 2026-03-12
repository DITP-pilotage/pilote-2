-- Calcule le Taux d'avancement en fonction des colonnes de:
--  - Valeur initiale: vi_col
--  - Valeur cible: vc_col
--  - Valeur actuelle comparable: vac_col . Il s'agit de la valeur actuelle que l'on peut comparer à la VI et VC. Par exemple, ce sera une valeur déjà cumulée si la cible est un objectif de cumul.

{% macro compute_ta_hausse_macro(vi_col, vc_col, vac_col) %}

case 
    -- VI>=VC
    WHEN {{ vi_col }}>={{ vc_col }} AND {{ vac_col }} >= {{ vc_col }} THEN 100
    WHEN {{ vi_col }}>={{ vc_col }} AND {{ vac_col }} < {{ vc_col }} THEN 0
    -- else
    else round((100*({{ vac_col }}-{{ vi_col }})/({{ vc_col }}-{{ vi_col }}))::numeric, {{ var('ta_decimales') }}) 
end

{% endmacro %}


{% macro compute_ta_baisse_macro(vi_col, vc_col, vac_col) %}

case 
    -- VI<=VC
    WHEN {{ vi_col }}<={{ vc_col }} AND {{ vac_col }} <= {{ vc_col }} THEN 100
    WHEN {{ vi_col }}<={{ vc_col }} AND {{ vac_col }} > {{ vc_col }} THEN 0
    -- else
    else round((100*({{ vac_col }}-{{ vi_col }})/({{ vc_col }}-{{ vi_col }}))::numeric, {{ var('ta_decimales') }}) 
end

{% endmacro %}
