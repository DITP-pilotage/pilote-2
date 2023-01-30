import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_raw = os.getenv('DUMP_DFAKTO_RP_RAW')
    dim_tree_nodes = pd.read_csv(
        f'{dump_dfakto_rp_raw}/dim_tree_nodes.csv',
        sep=';'
    )

    columns_type = {
        'tree_node_id': 'str',
        'tree_node_parent_id': 'str',
        'structure_id': 'str',
        'maturity_id': 'str',
        'tree_node_name': 'str',
        'tree_node_code': 'str',
        'tree_node_status': 'str',
        'tree_node_last_synchronization_date': 'datetime64[ns]',
        'tree_node_last_update_properties_date': 'datetime64',
        'tree_node_last_update_scorecard_date': 'datetime64',
        'tree_node_last_scorecard_update_by_anybody_date': 'datetime64',
        'tree_node_last_update_children_date': 'datetime64',
        'tree_node_currency': 'str',
        'snapshot_date': 'datetime64',
    }

    dim_tree_nodes = dim_tree_nodes.astype(columns_type)

    return dim_tree_nodes
