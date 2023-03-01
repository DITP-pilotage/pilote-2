import pandas as pd
import os


def model(dbt, session):
    import_commentaires = os.getenv('IMPORT_COMMENTAIRES')
    commentaires = pd.read_csv(f'{import_commentaires}/import_commentaires.csv')

    return commentaires