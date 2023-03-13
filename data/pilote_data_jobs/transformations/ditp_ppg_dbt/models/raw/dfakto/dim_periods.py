import pandas as pd
import os


def model(dbt, session):
    #dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dump_dfakto_rp_raw = '/Users/fabien.roussel/Documents/Missions/DITP/ditp-pilote-draft/data/input_data/private_data/dump_dfakto_octo_2'
    dim_periods = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_periods_202303091524.csv',
        sep=';'
    )

    columns_type = {
        'snapshot_date': 'datetime64',
    }
    dim_periods = dim_periods.astype(columns_type)

    # Comme une date est 9999-12-31 23:59:59 on préfère mettre la valeur à NaT
    # dim_periods['period_date'] = pd.to_datetime(dim_periods['period_date'], errors='coerce')

    return dim_periods
