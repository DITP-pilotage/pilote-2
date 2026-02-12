import argparse
import os
import re
import json
import pandas as pd

from typing import Any

from numbers import Real

from sqlalchemy import create_engine

from src.proxy.logger import get_logger

logger = get_logger(__name__)


EXPOSITION_TABLES = [
    "public.axe",
    "public.chantier_identite",
    "public.chantier_territoire_jalon",
    "public.chantier_territoire",
    "public.commentaire",
    "public.decision_strategique",
    "public.indicateur_identite",
    "public.indicateur_territoire_jalon",
    "public.indicateur_territoire",
    "public.ministere",
    "public.objectif",
    "public.perimetre",
    "public.ppg",
    "public.synthese_des_resultats",
]

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
    "--no_csv_output",
    action="store_true",
    default=False,
    help="If set, do NOT write differences as CSV files. By default, CSV output is enabled.",
)
parser.add_argument(
    "--normalize",
    "-n",
    action="store_true",
    help="If set, normalize values before comparison (rounding, list/tuple sorting, etc.). Default is raw comparison."
)
parser.add_argument(
    "--source",
    help=(
        "Override the default source PostgreSQL connection string. "
        "If not set, constructed from PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE env variables."
    ),
)
parser.add_argument(
    "--target",
    help=(
        "Override the default target PostgreSQL connection string. "
        "If not set, defaults to CONN_STR_DEV environment variable."
    ),
)

args = parser.parse_args()

if args.tables:
    tables = args.tables
else:
    tables = EXPOSITION_TABLES


if args.source:
    source_connection_string = args.source
else:
    pg_host = os.environ.get("PGHOST", "localhost")
    pg_port = os.environ.get("PGPORT", "5432")
    pg_user = os.environ.get("PGUSER", "postgresql")
    pg_password = os.environ.get("PGPASSWORD", "secret")
    pg_database = os.environ.get("PGDATABASE", "postgresql")
    source_connection_string = (
        f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
    )

if args.target:
    target_connection_string = args.target
else:
    target_connection_string = os.environ.get("CONN_STR_DEV")
    if not target_connection_string:
        raise RuntimeError(
            "No target connection string provided: pass --target or define CONN_STR_DEV in the environment."
        )



def _read_table_as_df(
    engine_url: str,
    table_name: str,
    schema: str,
) -> pd.DataFrame:
    """
    Reads a given table from a PostgreSQL database into a pandas DataFrame.

    Args:
        engine_url (str): SQLAlchemy connection string.
        table_name (str): The table to read.
        schema (str): The schema containing the table.

    Returns:
        pd.DataFrame: Table content as a DataFrame.
    """
    engine = create_engine(engine_url)
    sql = f'SELECT * FROM "{schema}"."{table_name}"'
    try:
        df = pd.read_sql(sql, engine)
    finally:
        engine.dispose()
    return df


def _split_schema_and_table(table_reference: str) -> tuple[str | None, str]:
    """
    Splits a table reference into (schema, table_name). Accepts "table" or "schema.table".

    Args:
        table_reference (str): Table reference, possibly with schema.

    Returns:
        tuple[str | None, str]: The (schema, table_name) pair.
    
    Raises:
        ValueError: If the table reference is not valid.
    """
    # On check si on récupère bien un nom de table ou un nom de table avec schema
    table_pattern = r"^[A-Za-z_][A-Za-z0-9_]*$"
    schema_table_pattern = r"^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$"

    if re.match(table_pattern, table_reference):
        logger.warning(
            "No schema provided for table '%s'. Using 'public' as default.",
            table_reference,
        )
        return "public", table_reference
    match = re.match(schema_table_pattern, table_reference)
    if match:
        schema, table_name = match.groups()
        return schema, table_name
    raise ValueError(
        f"Invalid table name '{table_reference}'. Expected format 'schema.table' or 'table'."
    )


def recursively_round(obj):
    """
    Recursively rounds any numeric value found under the key 'valeur' in a dictionary,
    or any standalone numeric value, to 2 decimal places. The function traverses nested
    structures including dicts, lists, tuples, and sets. Booleans are not rounded.

    Args:
        obj: The object to recursively process (dict, list, tuple, set, or numeric value).

    Returns:
        The processed object with applicable numeric values rounded to 2 decimals.
    """
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            if k == "valeur" and isinstance(v, Real) and not isinstance(v, bool):
                new_obj[k] = round(float(v), 2)
            else:
                new_obj[k] = recursively_round(v)
        return new_obj
    elif isinstance(obj, list):
        return [recursively_round(v) for v in obj]
    elif isinstance(obj, tuple):
        return tuple(recursively_round(v) for v in obj)
    elif isinstance(obj, set):
        return sorted(recursively_round(v) for v in obj)
    elif isinstance(obj, Real) and not isinstance(obj, bool):
        return round(float(obj), 2)
    else:
        return obj

def _normalize_within_cell(content):
    """
    If cell content is a dict with a "valeur" key and its value is numeric, round the value to 2 decimals.
    Stringify the dict result (for comparison purposes).

    Args:
        content: Any value, expected dict or other.

    Returns:
        str: Stringified version of the cell value, possibly with rounded "valeur".
    """
    # If value is a dict with a "valeur" key and its value is a number, round value to 2 decimals
    normed = recursively_round(content)
    if isinstance(normed, dict) or isinstance(normed, list):
        return json.dumps(normed, sort_keys=True, ensure_ascii=False)
    return str(normed)


def _normalize_cell(value: Any) -> Any:
    """
    Function defined to identify major changes only by reducing minor ordering/rounding diffs between dbs
    Normalize a cell's value for comparison:
     - Rounds numbers (excluding bool) to 2 decimals.
     - For lists/tuples/sets: sort, normalize elements, and output as tuple.
     - Otherwise: return value unchanged.

    Args:
        value (Any): The value to normalize.

    Returns:
        Any: The normalized value or string for comparison.
    """
    # Numbers: round to 2 decimals (but avoid treating bool as number)
    if isinstance(value, Real) and not isinstance(value, bool):
        value = round(float(value), 2)
    # Normalize list/tuple/set of strings by sorting
    if isinstance(value, (list, tuple, set)):
        try:
            return tuple(sorted(_normalize_within_cell(v) for v in value))
        except TypeError:
            # In case elements are not comparable, just stringify the whole thing
            return str(value)
    return value


def _diff_tables_row_by_row(
    source_url: str,
    target_url: str,
    schema: str,
    table_name: str,
    normalize: bool = True,
) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Compares source and target tables row-by-row and returns detailed differences.

    Args:
        source_url (str): SQLAlchemy URL for the source database.
        target_url (str): SQLAlchemy URL for the target database.
        schema (str): The schema containing the table.
        table_name (str): The table to compare.
        normalize (bool, optional): If True, normalize values (round numbers, sort lists, etc). Defaults to False.

    Returns:
        tuple[list[dict[str, Any]], list[str]]:
            - List of dict differences. Each dict has a "side" key ("source" or "target") and the differing row.
            - List of column names in common (to be used for the CSV output).
    """
    source_df = _read_table_as_df(source_url, table_name, schema)
    target_df = _read_table_as_df(target_url, table_name, schema)

    if len(source_df) != len(target_df):
        logger.warning(
            "[Table: %s] Row count mismatch. Source rows: %d, Target rows: %d.",
            f"{schema}.{table_name}",
            len(source_df),
            len(target_df),
        )

    source_columns = set(source_df.columns)
    target_columns = set(target_df.columns)
    common_columns = sorted(source_columns.intersection(target_columns))

    extra_in_source = sorted(source_columns - target_columns)
    extra_in_target = sorted(target_columns - source_columns)

    if extra_in_source or extra_in_target:
        logger.warning(
            "[Table: %s] Column mismatch. Only in source: %s. Only in target: %s.",
            f"{schema}.{table_name}",
            extra_in_source,
            extra_in_target,
        )

    if not common_columns:
        logger.warning(
            "[Table: %s] No common columns between source and target, skipping.",
            f"{schema}.{table_name}",
        )
        return [], common_columns

    # Normalise si demandé (arrondi, ordonnancement des arrays, etc.)
    if normalize:
        source_aligned = (
            source_df[common_columns].map(_normalize_cell).to_numpy().tolist()
        )
        target_aligned = (
            target_df[common_columns].map(_normalize_cell).to_numpy().tolist()
        )
    else:
        source_aligned = source_df[common_columns].to_numpy().tolist()
        target_aligned = target_df[common_columns].to_numpy().tolist()

    # On crée des arrays du row sous forme de string (pour la comparaison) et brut (pour l'output csv)
    source_rows = [[str(tuple(row)), tuple(row)] for row in source_aligned]
    target_rows = [[str(tuple(row)), tuple(row)] for row in target_aligned]

    target_row_strs = set(row[0] for row in target_rows)
    source_row_strs = set(row[0] for row in source_rows)

    only_in_source = [row[1] for row in source_rows if row[0] not in target_row_strs]
    only_in_target = [row[1] for row in target_rows if row[0] not in source_row_strs]

    differences: list[dict[str, Any]] = []

    for row in only_in_source:
        logger.info("[Table: %s] Source-only row: %s", f"{schema}.{table_name}", row)
        entry = {"side": "source"}
        entry.update({col: val for col, val in zip(common_columns, row)})
        differences.append(entry)

    for row in only_in_target:
        logger.info("[Table: %s] Target-only row: %s", f"{schema}.{table_name}", row)
        entry = {"side": "target"}
        entry.update({col: val for col, val in zip(common_columns, row)})
        differences.append(entry)

    return differences, common_columns


def main():
    all_differences: list[dict[str, Any]] = []

    for table_reference in tables:
        schema, table_name = _split_schema_and_table(table_reference)
        logger.info("[DIFFING][Table: %s]", table_reference)
        differences, common_columns = _diff_tables_row_by_row(
            source_url=source_connection_string,
            target_url=target_connection_string,
            schema=schema,
            table_name=table_name,
            normalize=args.normalize,
        )
        all_differences.extend([dict(d, table=f"{schema}.{table_name}") for d in differences])

        if not args.no_csv_output and differences:
            # On crée le fichier de diff de la table dans le dossier output
            output_dir = os.path.join(os.path.dirname(__file__), "output")
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f"{schema}.{table_name}.csv")
            df_table = pd.DataFrame(differences)
            cols = ["side"] + list(common_columns)
            df_table.to_csv(output_path, columns=cols, index=False)
            logger.warning(
                "[DIFFING][Table: %s] %d differences saved to %s",
                f"{schema}.{table_name}",
                len(differences),
                output_path,
            )

if __name__ == "__main__":
    main()
