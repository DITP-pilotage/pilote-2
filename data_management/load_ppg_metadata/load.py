import os
import yaml
import sys
from sqlalchemy import create_engine
from GithubRepo import GithubRepo
from sql_utils import generateQueriesCreateSchema


def getTablesOfGroup(group_name, config):
    return config.get('groups').get(group_name, {"tables": {}}).get('tables')


# [config] Tables à charger
CONFIG_PATH='load_ppg_metadata/tables.yml'
CONFIG=None

with open(CONFIG_PATH, 'r') as file:
    CONFIG = yaml.safe_load(file)


# [config] Repo Github
github_branch = os.environ.get("PPG_METADATA_GITHUB_BRANCH", CONFIG.get('github_repo').get('default_branch'))
ppg_metadata_repo = GithubRepo(os.environ.get('PPG_METADATA_GITHUB_TOKEN'), CONFIG.get('github_repo').get('user'), CONFIG.get('github_repo').get('repo'))

# [config] Base de données
conn_str = "".join([
    "postgresql://",
    os.environ.get("PGUSER"),":",os.environ.get("PGPASSWORD"),
    "@",os.environ.get("PGHOST"),":",os.environ.get("PGPORT"),
    "/",os.environ.get("PGDATABASE")
])
engine = create_engine(conn_str)

# main


with engine.connect() as con:


    tables = getTablesOfGroup(sys.argv[1], CONFIG)
    print(len(tables.items()), "tables detected for group", sys.argv[1])


    # Determine all schema used by the tables
    distinct_schemas = list(set([table_options.get('schema') for _, table_options in tables.items()]))
    q_create_schemas = generateQueriesCreateSchema(distinct_schemas)
    # Create every schema
    for q in q_create_schemas:
        print(q)
        con.execute(q)

    for table_name, table_options in tables.items():
        print("Handling "+table_name)

        # Download table and add its content to database
        csv_as_df = ppg_metadata_repo.getFileAsDataframe(table_options.get('path_in_repo'), github_branch)
        csv_as_df.to_sql(name=table_name, con=con, if_exists='replace', schema=table_options.get('schema'))

        # Commit for each table
        # con.commit()
    # Commit once, if no error
    con.commit()
    con.close()
    ppg_metadata_repo.close()
    print('Data persisted !')

