import pandas as pd
import os
import glob
import re
from datetime import datetime


def get_latest_commentaires_csv(import_commentaires_folder: str):
    list_of_files = glob.glob(import_commentaires_folder+'/*')
    dict = {}
    for f in list_of_files:
        match = re.search(r"((\d+))_", f)
        d = datetime.strptime(match.group(1), '%Y%m%d')
        dict[d] = f
    return dict[max(dict.keys())]


def model(dbt, session):
    folder_commentaires = os.getenv('IMPORT_COMMENTAIRES')
    commentaires = pd.read_csv(get_latest_commentaires_csv(folder_commentaires))
    return commentaires
