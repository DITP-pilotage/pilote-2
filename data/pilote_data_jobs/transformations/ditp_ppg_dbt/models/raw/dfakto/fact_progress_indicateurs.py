import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_2')
    fact_progress_indicateurs = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress.csv',
        sep=';'
    )

    columns_type = {
        'valeur_initiale': 'float64',
        'valeur_actuelle': 'float64',
        'valeur_cible_intermediaire': 'float64',
        'valeur_cible_globale': 'float64',
        'progress_intermediaire': 'float64',
        'bounded_progress_intermediaire': 'float64',
        'progress_globale': 'float64',
        'bounded_progress_globale': 'float64',
        'date_valeur_initiale': 'datetime64',
        'date_valeur_actuelle': 'datetime64',
        'date_valeur_cible_intermediaire': 'datetime64',
        'date_valeur_cible_globale': 'datetime64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_indicateurs = fact_progress_indicateurs.astype(columns_type)

    return fact_progress_indicateurs
