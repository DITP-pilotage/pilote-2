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
    return [arrow_table]

@dlt.source()
def ppg_metadata_source(github_repo, csv_to_load: str = dlt.config.value):
    for csv_name, csv_path in json.loads(csv_to_load).items():
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
        dataset_name=dlt.config.get("destination.db_pilote.config").get('target_schema'), # db schema        
    )
    load_info = p.run(ppg_metadata_source(github_repo), write_disposition='replace')

    github_repo.close()
    print(load_info)



load_data()
