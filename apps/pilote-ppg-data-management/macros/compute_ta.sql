{% macro compute_ta(vi_col, vc_col, vac_col, tendance_col) %}

CASE
    WHEN {{ tendance_col }} IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN {{ vi_col }} >= {{ vc_col }} AND {{ vac_col }} >= {{ vc_col }}
                    THEN 100
                WHEN {{ vi_col }} >= {{ vc_col }} AND {{ vac_col }} < {{ vc_col }}
                    THEN 0
                ELSE ROUND((100 * ({{ vac_col }} - {{ vi_col }}) / ({{ vc_col }} - {{ vi_col }}))::NUMERIC, {{ var('ta_decimales') }}) 
            END
    WHEN {{ tendance_col }} IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN {{ vi_col }} <= {{ vc_col }} AND {{ vac_col }} <= {{ vc_col }}
                    THEN 100
                WHEN {{ vi_col }} <= {{ vc_col }} AND {{ vac_col }} > {{ vc_col }}
                    THEN 0
                ELSE ROUND((100 * ({{ vac_col }} - {{ vi_col }}) / ({{ vc_col }} - {{ vi_col }}))::NUMERIC, {{ var('ta_decimales') }}) 
            END
    ELSE NULL
END
{% endmacro %}
