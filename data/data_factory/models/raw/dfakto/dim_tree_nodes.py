import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_2')
    dim_tree_nodes = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_tree_nodes_202303091524.csv',
        sep=';'
    )

    columns_type = {
        'tree_node_last_synchronization_date': 'datetime64[ns]',
        'tree_node_last_update_properties_date': 'datetime64[ns]',
        'tree_node_last_update_scorecard_date': 'datetime64[ns]',
        'tree_node_last_scorecard_update_by_anybody_date': 'datetime64[ns]',
        'snapshot_date': 'datetime64[ns]',
    }

    dim_tree_nodes = dim_tree_nodes.astype(columns_type)

    return dim_tree_nodes
