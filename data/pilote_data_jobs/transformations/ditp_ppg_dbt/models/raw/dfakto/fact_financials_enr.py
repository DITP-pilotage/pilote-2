import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    fact_financials_enr = pd.read_csv(f'{dump_dfakto_rp_raw}/fact_financials_enr_short.csv')

    return fact_financials_enr
