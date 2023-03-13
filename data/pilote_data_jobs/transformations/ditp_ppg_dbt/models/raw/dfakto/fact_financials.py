import pandas as pd
import os


def model(dbt, session):
    #dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dump_dfakto_rp_raw = '/Users/fabien.roussel/Documents/Missions/DITP/ditp-pilote-draft/data/input_data/private_data/dump_dfakto_octo_2'
    fact_financials = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_financials_202303091524.csv',
        sep=';',
    )

    return fact_financials
