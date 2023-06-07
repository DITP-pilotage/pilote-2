import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_octo_ps = os.getenv('DUMP_DFAKTO_PS')
    ps_view_data_kpis = pd.read_csv(
        f'{dump_dfakto_octo_ps}/ps_view_data_kpis_202304191200.csv',
        sep=';',
        dtype = {'unite': str, 'ps_code': str}
    )

    columns_type = {
        'vi': 'float64',
        'va': 'float64',
        'vc': 'float64',
        'vi_maj': 'datetime64',
        'va_maj': 'datetime64',
        'vc_maj': 'datetime64',
    }

    ps_view_data_kpis = ps_view_data_kpis.astype(columns_type)

    return ps_view_data_kpis
