import pandas as pd
import os

def model(dbt, session):
    return pd.read_csv(f"{os.getenv('PPG_METADATA_MODELS')}/chantier/ref_chantier_engagement.csv")
