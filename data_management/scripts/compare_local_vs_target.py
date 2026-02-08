import argparse
import os
from typing import Any

from numbers import Real

import pandas as pd
from sqlalchemy import create_engine

from src.proxy.logger import get_logger

logger = get_logger(__name__)


EXPOSITION_TABLES = [
    "axe",
    "chantier_identite",
    "chantier_territoire_jalon",
    "chantier_territoire",
    "commentaire",
    "decision_strategique",
    "indicateur_identite",
    "indicateur_territoire_jalon",
    "indicateur_territoire",
    "ministere",
    "objectif",
    "perimetre",
    "ppg",
    "synthese_des_resultats",
]


def _read_table_as_df(
    engine_url: str,
    schema: str,
    table_name: str,
) -> pd.DataFrame:
    engine = create_engine(engine_url)
    sql = f'SELECT * FROM "{schema}"."{table_name}"'
    return pd.read_sql(sql, engine)


def _split_schema_and_table(qualified_name: str) -> tuple[str, str]:
    try:
        schema, table_name = qualified_name.split(".", maxsplit=1)
    except ValueError:
        raise ValueError(
            f"Invalid table name '{qualified_name}'. Expected format 'schema.table'."
        ) from None
    return schema, table_name


def _normalize_inner(v):
    # If v is a dict with a "value" key and its value is a number, round value to 2 decimals
    if isinstance(v, dict) and "valeur" in v and isinstance(v["valeur"], Real) and not isinstance(v["valeur"], bool):
        rounded = round(float(v["valeur"]), 2)
        v = {**v, "valeur": rounded}
    return str(v)


def _normalize_cell(value: Any) -> Any:
    # Numbers: round to 2 decimals (but avoid treating bool as number)
    if isinstance(value, Real) and not isinstance(value, bool):
        value = round(float(value), 2)
    # Normalize list/tuple/set of strings by sorting
    if isinstance(value, (list, tuple, set)):
        try:
            return tuple(sorted(_normalize_inner(v) for v in value))
        except TypeError:
            # In case elements are not comparable, just stringify the whole thing
            return str(value)
    # String that looks like a Python list, e.g. "['a', 'b']"
    if isinstance(value, str) and value.strip().startswith("[") and value.strip().endswith("]"):
        raise Exception("test")
        try:
            parsed = ast.literal_eval(value)
            if isinstance(parsed, (list, tuple, set)):
                return str(sorted(_normalize_inner(v) for v in parsed))
        except (ValueError, SyntaxError):
            return value

    return value


def _diff_tables_row_by_row(
    source_url: str,
    target_url: str,
    qualified_table_name: str,
) -> list[dict[str, Any]]:
    schema, table_name = _split_schema_and_table(qualified_table_name)

    source_df = _read_table_as_df(source_url, schema, table_name)
    target_df = _read_table_as_df(target_url, schema, table_name)

    # Align columns by name and order for comparison
    source_columns = set(source_df.columns)
    target_columns = set(target_df.columns)
    common_columns = sorted(source_columns.intersection(target_columns))

    extra_in_source = sorted(source_columns - target_columns)
    extra_in_target = sorted(target_columns - source_columns)

    if extra_in_source or extra_in_target:
        logger.warning(
            "[Table: %s] Column mismatch. Only in source: %s. Only in target: %s.",
            qualified_table_name,
            extra_in_source,
            extra_in_target,
        )

    if not common_columns:
        logger.warning(
            "[Table: %s] No common columns between source and target, skipping.",
            qualified_table_name,
        )
        return []

    source_aligned = source_df[common_columns].map(_normalize_cell).to_numpy().tolist()
    target_aligned = target_df[common_columns].map(_normalize_cell).to_numpy().tolist()

    source_rows = {str(tuple(row)) for row in source_aligned}
    target_rows = {str(tuple(row)) for row in target_aligned}

    only_in_source = source_rows - target_rows
    only_in_target = target_rows - source_rows

    differences: list[dict[str, Any]] = []

    for row in only_in_source:
        logger.info("[Table: %s]+, %s", qualified_table_name, row)
        differences.append(
            {
                "table": qualified_table_name,
                "side": "+",
                "row": row,
            }
        )

    for row in only_in_target:
        logger.info("[Table: %s]-, %s", qualified_table_name, row)
        differences.append(
            {
                "table": qualified_table_name,
                "side": "-",
                "row": row,
            }
        )

    return differences


parser = argparse.ArgumentParser()
parser.add_argument(
    "--tables",
    "-t",
    nargs="+",
    help=(
        "List of fully qualified table names to diff (schema.table). "
        "If omitted, defaults to the EXPOSITION_TABLES list in the public schema."
    ),
)
parser.add_argument(
    "--output-csv",
    "-o",
    help="Optional path to write differences as a CSV file.",
)

args = parser.parse_args()

if args.tables:
    tables = args.tables
else:
    tables = [f"public.{table_name}" for table_name in EXPOSITION_TABLES]

# Construct connection strings from environment variables
pg_host = os.environ.get("PGHOST", "localhost")
pg_port = os.environ.get("PGPORT", "5432")
pg_user = os.environ.get("PGUSER", "postgresql")
pg_password = os.environ.get("PGPASSWORD", "secret")
pg_database = os.environ.get("PGDATABASE", "postgresql")

source_connection_string = (
    f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
)
target_connection_string = os.environ["CONN_STR_DEV"]

all_differences: list[dict[str, Any]] = []

for qualified_table_name in tables:
    logger.info("[DIFFING][Table: %s]", qualified_table_name)
    all_differences.extend(
        _diff_tables_row_by_row(
            source_url=source_connection_string,
            target_url=target_connection_string,
            qualified_table_name=qualified_table_name,
        )
    )

if args.output_csv and all_differences:
   df =  pd.DataFrame(all_differences)
   df.sort_values(by=[df.columns[0], df.columns[2]]).to_csv(args.output_csv, index=False)
