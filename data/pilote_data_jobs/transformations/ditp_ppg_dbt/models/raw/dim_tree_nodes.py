import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    my_sql_model_df = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_tree_nodes.csv',
        sep=';'
    )

    return my_sql_model_df
