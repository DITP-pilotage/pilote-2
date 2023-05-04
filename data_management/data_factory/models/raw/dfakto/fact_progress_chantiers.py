import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_5')
    fact_progress_chantiers = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress_chantier_202305041027.csv',
        sep=';'
    )

    columns_type = {
        'progress_intermediaire': 'float64',
        'progress_globale': 'float64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_chantiers = fact_progress_chantiers.astype(columns_type)

    return fact_progress_chantiers
