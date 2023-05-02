import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_octo_ps = os.getenv('DUMP_DFAKTO_PS')
    ps_view_data_financials = pd.read_csv(
        f'{dump_dfakto_octo_ps}/ps_view_data_financials_202304191200.csv',
        sep=';',
    )

    return ps_view_data_financials
