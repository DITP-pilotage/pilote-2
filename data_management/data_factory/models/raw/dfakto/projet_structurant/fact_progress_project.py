import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_ps = os.getenv('DUMP_DFAKTO_TEMP')
    fact_progress_project = pd.read_csv(
        f'{dump_dfakto_ps}/fact_progress_project.csv',
        sep=';'
    )

    return fact_progress_project