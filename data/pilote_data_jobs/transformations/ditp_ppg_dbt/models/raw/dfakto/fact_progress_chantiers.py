import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    fact_progress_chantiers = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress_reform.csv',
        sep=';'
    )

    columns_type = {
        'period_id': 'int16',
        'progress': 'float64',
        'bounded_progress': 'float64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_chantiers = fact_progress_chantiers.astype(columns_type)

    return fact_progress_chantiers
