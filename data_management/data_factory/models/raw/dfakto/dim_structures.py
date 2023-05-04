import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_5')
    dim_structures = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_structures_202305041143.csv',
        sep=';'
    )
    columns_type = {
        'structure_level': 'int16',
        'snapshot_date': 'datetime64',
    }

    dim_structures = dim_structures.astype(columns_type)

    return dim_structures
