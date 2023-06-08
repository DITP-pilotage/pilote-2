import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_ps = os.getenv('DUMP_DFAKTO_TEMP')
    dim_tree_nodes = pd.read_csv(
        f'{dump_dfakto_ps}/dim_tree_nodes_ps.csv',
        sep=';'
    )

    columns_type = {
        'tree_node_last_update_properties_date': 'datetime64[ns]',
        'tree_node_last_update_scorecard_date': 'datetime64[ns]',
        'tree_node_last_scorecard_update_by_anybody_date': 'datetime64[ns]',
        'snapshot_date': 'datetime64[ns]',
    }

    dim_tree_nodes = dim_tree_nodes.astype(columns_type)

    return dim_tree_nodes
