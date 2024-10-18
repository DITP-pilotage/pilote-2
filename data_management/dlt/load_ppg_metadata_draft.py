import dlt
import os

import psycopg2
from github_utils import GithubRepo
from pyarrow import csv
import io
import json
import pyarrow.csv as csv
import sys

def dl_github_file(github_repo, path, branch):
    # See https://arrow.apache.org/docs/python/generated/pyarrow.csv.read_csv.html#pyarrow-csv-read-csv
    csv_string = github_repo.getFileContent(path, branch)
    arrow_table = csv.read_csv(io.BytesIO(csv_string.encode()))
    # arrow_table = arrow_table.rename_columns([x.lower() for x in arrow_table.column_names])
    pd_table = arrow_table.to_pandas()
    return arrow_table

def load_data(pipeline_, schema_) -> None:
    github_repo_config = dlt.config.get("github_repo")
    github_branch = os.environ.get("PPG_METADATA_GITHUB_BRANCH", github_repo_config.get('default_branch'))
    github_repo = GithubRepo(
                os.environ.get('PPG_METADATA_GITHUB_TOKEN'),
                github_repo_config.get('user'), 
                github_repo_config.get('repo')
    )

    load_info = pipeline_.run(ppg_metadata_source(github_repo, github_branch, schema_), write_disposition='replace', refresh="drop_resources")
    github_repo.close()
    print(load_info)


def loadCSV(csv_path, table_name, table_schema, cursor_):
    # f = open(csv_path)
    ff = dl_github_file("PPG_metadata", csv_path, "prod")
    res = cursor_.copy_from(ff, table_schema+'.'+table_name, sep=',', null='')
    print(res)


if __name__=="__main__":
    conn_str = "".join([
        "postgresql://",
        os.environ.get("PGUSER"),":",os.environ.get("PGPASSWORD"),
        "@",os.environ.get("PGHOST"),":",os.environ.get("PGPORT"),
        "/",os.environ.get("PGDATABASE")
    ])

    conn = psycopg2.connect(conn_str)

    curs=conn.cursor()

    # leaving contexts doesn't close the connection

    if (sys.argv[1]=="metadata"):

        github_repo = GithubRepo(
                os.environ.get('PPG_METADATA_GITHUB_TOKEN'),
                'DITP-pilotage', 
                'PPG_metadata'
        )
        # loadCSV("views/axe/view_meta_axe.csv", "metadata_axe", "raw_data", curs)
        ff = dl_github_file(github_repo, "views/axe/view_meta_axe.csv", "prod")
        csv.write_csv(ff, "/tmp/view_meta_axe.csv")
        ff2= open("/tmp/view_meta_axe.csv")
        curs.execute("DROP TABLE IF EXISTS "+ "raw_data"+'.'+"metadata_axe")
        res = curs.copy_from(ff2, "raw_data"+'.'+"metadata_axe", sep=',', null='')


        schema="raw_data"
    elif (sys.argv[1]=="seeds"):
        pipeline = dlt.pipeline(
            destination=dlt.destinations.postgres(conn_str),
            import_schema_path="dlt/schema/import",
            # export_schema_path="dlt/schema/export",
            dataset_name="tmp", # db schema   
        )
        schema="tmp"
    else:
        print('Veuillez spécifier une option valide !')
    

    conn.close()

    load_data(pipeline, schema)
else:
    pass
