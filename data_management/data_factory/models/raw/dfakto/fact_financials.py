import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_5')
    fact_financials = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_financials_202305041143_short.csv',
        sep=';',
    )

    return fact_financials
