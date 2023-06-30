import pandas as pd
import os

def model(dbt, session):
    dump_dfakto_ps = os.getenv('DUMP_DFAKTO_TEMP')
    fact_property_values = pd.read_csv(
        f'{dump_dfakto_ps}/fact_property_values.csv',
        sep=';'
    )

    columns_type = {
        'property_value_last_update': 'datetime64[ns]',
        'snapshot_date': 'datetime64[ns]',
    }

    fact_property_values = fact_property_values.astype(columns_type)

    return fact_property_values
