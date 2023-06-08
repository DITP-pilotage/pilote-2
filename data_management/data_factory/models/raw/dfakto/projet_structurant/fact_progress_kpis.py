import pandas as pd
import os

def model(dbt, session):
    dump_dfakto_ps = os.getenv('DUMP_DFAKTO_TEMP')
    fact_progress_kpis = pd.read_csv(
        f'{dump_dfakto_ps}/fact_progress_kpis.csv',
        sep=';'
    )

    columns_type = {
        'date_last_update_valeur_initiale': 'datetime64[ns]',
        'date_last_update_valeur_actuelle': 'datetime64[ns]',
        'date_last_update_valeur_cible': 'datetime64[ns]',
        'valeur_initiale': 'float64',
        'valeur_actuelle': 'float64',
        'valeur_cible': 'float64',
    }

    fact_progress_kpis = fact_progress_kpis.astype(columns_type)

    return fact_progress_kpis
