import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dim_structures = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_structures.csv',
        sep=';'
    )
    columns_type = {
        'structure_id': 'str',
        'top_level_id': 'str',
        'structure_name': 'str',
        'structure_is_part_of_update_period': 'bool',
        'structure_scorecard_frequency': 'str',
        'structure_is_hidden': 'bool',
        'structure_has_correction': 'bool',
        'structure_level': 'int16',
        'snapshot_date': 'datetime64',
    }

    dim_structures = dim_structures.astype(columns_type)

    return dim_structures
