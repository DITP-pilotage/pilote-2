import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_octo_ps = os.getenv('DUMP_DFAKTO_PS')
    fact_progress_project = pd.read_csv(
        f'{dump_dfakto_octo_ps}/fact_progress_project_202304191200.csv',
        sep=';'
    )

    return fact_progress_project