import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_TEMP')
    fact_progress_indicateurs = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress.csv',
        sep=';'
    )

    columns_type = {
        'date_valeur_initiale': 'datetime64',
        'date_valeur_actuelle': 'datetime64',
        'date_valeur_cible_intermediaire': 'datetime64',
        'date_valeur_cible_globale': 'datetime64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_indicateurs = fact_progress_indicateurs.astype(columns_type)

    return fact_progress_indicateurs
