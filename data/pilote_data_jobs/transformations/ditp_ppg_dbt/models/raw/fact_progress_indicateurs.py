import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    my_sql_model_df = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress.csv',
        sep=';'
    )

    return my_sql_model_df
