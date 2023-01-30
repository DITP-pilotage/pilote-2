import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    fact_progress_indicateurs = pd.read_csv(
        f'{dump_dfakto_rp_raw}/fact_progress.csv',
        sep=';'
    )

    columns_type = {
        'tree_node_id': 'str',
        'effect_id': 'str',
        'period_id': 'int16',
        'tag_applied': 'str',
        'valeur_initiale': 'float64',
        'valeur_actuelle': 'float64',
        'valeur_cible': 'float64',
        'progress': 'float64',
        'bounded_progress': 'float64',
        'date_valeur_initiale': 'datetime64',
        'date_valeur_actuelle': 'datetime64',
        'date_valeur_cible': 'datetime64',
        'snapshot_date': 'datetime64',
    }

    fact_progress_indicateurs = fact_progress_indicateurs.astype(columns_type)

    return fact_progress_indicateurs
