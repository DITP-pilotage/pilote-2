import pandas as pd
import os


def model(dbt, session):
    #dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dump_dfakto_rp_raw = '/Users/fabien.roussel/Documents/Missions/DITP/ditp-pilote-draft/data/input_data/private_data/dump_dfakto_octo_2'
    fact_progress_chantiers = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress_chantier.csv',
        sep=';'
    )

    columns_type = {
        'progress_intermediaire': 'float64',
        'progress_globale': 'float64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_chantiers = fact_progress_chantiers.astype(columns_type)

    return fact_progress_chantiers
