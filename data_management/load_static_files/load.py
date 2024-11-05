import os
import yaml
import sys
from sqlalchemy import create_engine
from utils.GithubRepo import GithubRepo
from utils.sql import generateQueriesCreateSchema


def getTablesOfGroup(group_name, config):
    return config.get('groups').get(group_name, {"tables": {}}).get('tables')


# [config] Tables à charger
CONFIG_PATH='load_static_files/tables.yml'
CONFIG=None

with open(CONFIG_PATH, 'r') as file:
    CONFIG = yaml.safe_load(file)



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

    cli_param_1 = sys.argv[1]
    tables = getTablesOfGroup(cli_param_1, CONFIG)
    repo_name = CONFIG.get('groups').get(cli_param_1, {"github_repo": ""}).get('github_repo')
    repo_params = CONFIG.get('github_repos').get(repo_name)
    print(len(tables.items()), "tables detected for group", cli_param_1)

    # [config] Repo Github
    repo = GithubRepo(os.environ.get('PPG_METADATA_GITHUB_TOKEN'), repo_params.get('user'), repo_params.get('repo'))
    repo_branch = repo_params.get('default_branch')
    if (repo_params.get('repo')=="PPG_metadata"):
        repo_branch = os.environ.get("PPG_METADATA_GITHUB_BRANCH", repo_params.get('default_branch'))


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
        csv_as_df = repo.getFileAsDataframe(table_options.get('path_in_repo'), repo_branch)
        csv_as_df.to_sql(name=table_name, con=con, if_exists='replace', schema=table_options.get('schema'))

        # Commit for each table
        # con.commit()
    # Commit once, if no error
    con.commit()
    con.close()
    repo.close()
    print('Data persisted !')
