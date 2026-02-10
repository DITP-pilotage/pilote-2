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
    return value


def _diff_tables_row_by_row(
    source_url: str,
    target_url: str,
    qualified_table_name: str,
    normalize: bool = True,
) -> tuple[list[dict[str, Any]], list[str]]:
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
        return [], common_columns

    # Optionally normalize values for comparison (rounding, list sorting, etc.)
    if normalize:
        source_aligned = (
            source_df[common_columns].map(_normalize_cell).to_numpy().tolist()
        )
        target_aligned = (
            target_df[common_columns].map(_normalize_cell).to_numpy().tolist()
        )
    else:
        # Use raw values as-is
        source_aligned = source_df[common_columns].to_numpy().tolist()
        target_aligned = target_df[common_columns].to_numpy().tolist()

    # Convert each row to list of [stringified, tuple] forms
    source_rows = [[str(tuple(row)), tuple(row)] for row in source_aligned]
    target_rows = [[str(tuple(row)), tuple(row)] for row in target_aligned]

    target_row_strs = set(row[0] for row in target_rows)
    source_row_strs = set(row[0] for row in source_rows)

    only_in_source = [row[1] for row in source_rows if row[0] not in target_row_strs]
    only_in_target = [row[1] for row in target_rows if row[0] not in source_row_strs]

    differences: list[dict[str, Any]] = []

    for row in only_in_source:
        logger.info("[Table: %s] Source-only row: %s", qualified_table_name, row)
        entry = {"side": "source"}
        entry.update({col: val for col, val in zip(common_columns, row)})
        differences.append(entry)

    for row in only_in_target:
        logger.info("[Table: %s] Target-only row: %s", qualified_table_name, row)
        entry = {"side": "target"}
        entry.update({col: val for col, val in zip(common_columns, row)})
        differences.append(entry)

    return differences, common_columns


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
    action="store_true",
    help="If set, write differences as CSV files (one file per table) into the 'output/' folder next to this script.",
)
parser.add_argument(
    "--raw",
    "-r",
    action="store_true",
    help="If set, compare raw values without normalization (no rounding or list/tuple sorting).",
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
    differences, common_columns = _diff_tables_row_by_row(
        source_url=source_connection_string,
        target_url=target_connection_string,
        qualified_table_name=qualified_table_name,
        normalize=not args.raw,
    )
    all_differences.extend([dict(d, table=qualified_table_name) for d in differences])

    # For output per table if requested
    if args.output_csv and differences:
        # Ensure output directory exists (default: 'output' folder next to this script)
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(output_dir, exist_ok=True)
        schema, table_name = _split_schema_and_table(qualified_table_name)
        output_path = os.path.join(output_dir, f"{schema}.{table_name}.csv")

        # Write the CSV with header: "side" plus the actual common_columns
        df_table = pd.DataFrame(differences)
        # Explicitly set column order: "side", then all common column names (sorted)
        cols = ["side"] + list(common_columns)
        # Write CSV
        df_table.to_csv(output_path, columns=cols, index=False)
