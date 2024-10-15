import dlt
import os
from github_utils import GithubRepo
from pyarrow import csv
import io
import json


def dl_github_file(github_repo, path):
    # See https://arrow.apache.org/docs/python/generated/pyarrow.csv.read_csv.html#pyarrow-csv-read-csv
    csv_string = github_repo.getFileContent(path)
    arrow_table = csv.read_csv(io.BytesIO(csv_string.encode()))
    # arrow_table = arrow_table.rename_columns([x.lower() for x in arrow_table.column_names])
    pd_table = arrow_table.to_pandas()
    return [pd_table]

@dlt.source()
def ppg_metadata_source(github_repo, schema, csv_to_load: str = dlt.config.value):
    print('[dlt] Schema: '+schema)
    for csv_name, csv_path in json.loads(csv_to_load).get('schema').get(schema).items():
        print('[dlt] Handling resource '+csv_name+'...')
        yield dlt.resource(dl_github_file(github_repo, csv_path), name=csv_name)

def load_data() -> None:
    github_repo_config = dlt.config.get("github_repo")
    github_repo = GithubRepo(
                os.environ.get('PPG_METADATA_GITHUB_TOKEN'),
                github_repo_config.get('user'), 
                github_repo_config.get('repo')
    )

    conn_str = "".join([
        "postgresql://",
        os.environ.get("PGUSER"),":",os.environ.get("PGPASSWORD"),
        "@",os.environ.get("PGHOST"),":",os.environ.get("PGPORT"),
        "/",os.environ.get("PGDATABASE")
    ])
    p = dlt.pipeline(
        destination=dlt.destinations.postgres(conn_str),
        import_schema_path="dlt/schema/import",
        #export_schema_path="dlt/schema/export",
        dataset_name='raw_data', # db schema        
    )
    load_info = p.run(ppg_metadata_source(github_repo, 'raw_data'), write_disposition='replace', refresh="drop_sources")
    p2 = dlt.pipeline(
        import_schema_path="dlt/schema/import",
        destination=dlt.destinations.postgres(conn_str),
        dataset_name="tmp", # db schema   
    )
    load_info = p2.run(ppg_metadata_source(github_repo, 'tmp'), write_disposition='replace', refresh="drop_sources")
    github_repo.close()
    print(load_info)



load_data()
