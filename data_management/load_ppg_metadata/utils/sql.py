from sqlalchemy import text
from jinja2 import Template

def generateQueriesCreateSchema(schema_list):
    CREATE_SCHEMA_SQL_PATH="load_ppg_metadata/queries/create_schema_x.sql"

    create_schema_queries=[]
    for schema_x in schema_list:
        sql_create_schema_x=text(Template(
            open(CREATE_SCHEMA_SQL_PATH, "r").read()).render(
                schema=schema_x
            ))
        create_schema_queries.append(sql_create_schema_x)
    return create_schema_queries
