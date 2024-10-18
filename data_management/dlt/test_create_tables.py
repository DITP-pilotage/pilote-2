from sqlalchemy import Table, Column, Integer, String
from sqlalchemy import create_engine
import os
from sqlalchemy import MetaData
# engine = create_engine("sqlite:///:memory:")

conn_str = "".join([
        "postgresql+psycopg2://",
        os.environ.get("PGUSER"),":",os.environ.get("PGPASSWORD"),
        "@",os.environ.get("PGHOST"),":",os.environ.get("PGPORT"),
        "/",os.environ.get("PGDATABASE")
    ])


engine = create_engine(conn_str)

metadata_obj = MetaData(schema='raw_data')

user = Table(
    "user",
    metadata_obj,
    Column("user_id", Integer, primary_key=True),
    Column("user_name", String(16), nullable=False),
    Column("email_address", String(60), key="email"),
    Column("nickname", String(50), nullable=False),
)

user_prefs = Table(
    "user_prefs",
    metadata_obj,
    Column("pref_id", Integer, primary_key=True),
    Column("user_id", Integer, nullable=False),
    Column("pref_name", String(40), nullable=False),
    Column("pref_value", String(100)),
)
user_prefs.drop(engine)

metadata_obj.create_all(engine)

