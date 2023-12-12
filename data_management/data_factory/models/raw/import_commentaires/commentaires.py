import pandas as pd
import os
import glob


def read_all_commentaires_files(import_commentaires_folder: str) -> pd.DataFrame:
    list_of_files = glob.glob(import_commentaires_folder+'/*')
    list_df = []
    for file in list_of_files:
        list_df.append(pd.read_csv(
            file, 
            keep_default_na=False, 
            encoding='utf-8', 
            sep=";",
            dtype={'code_insee': 'str', 'maille': 'str'}
        ))
    return pd.concat(list_df)


def model(dbt, session):
    folder_commentaires = os.getenv('IMPORT_COMMENTAIRES')
    commentaires = read_all_commentaires_files(folder_commentaires)
    return commentaires
