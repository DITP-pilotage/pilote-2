import pandas as pd
import os


def model(dbt, session):
    #dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dump_dfakto_rp_raw = '/Users/fabien.roussel/Documents/Missions/DITP/ditp-pilote-draft/data/input_data/private_data/dump_dfakto_octo_2'
    dim_structures = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_structures_202303091524.csv',
        sep=';'
    )
    columns_type = {
        'structure_level': 'int16',
        'snapshot_date': 'datetime64',
    }

    dim_structures = dim_structures.astype(columns_type)

    return dim_structures
