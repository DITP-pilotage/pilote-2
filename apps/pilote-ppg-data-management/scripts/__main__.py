import sys
import os
import subprocess
from notify import notify


"""
Exemple d'utilisation :

$  FULL_DJ=false uv run python3 scripts/__main__.py
$  RUN_TESTS=true uv run python3 scripts/__main__.py
"""

# Exécution de tous les jobs seulement si FULL_DJ==true
RUN_FULL_DATAJOBS = os.environ.get('FULL_DJ', "false").lower() == "true"

# Exécution des tests dbt seulement si RUN_TESTS==true
RUN_TESTS = os.environ.get('RUN_TESTS', "false").lower() == "true"

# Message d'erreur généré en cas de problème lors de l'exécution des jobs
ERROR_TITLE = (
    "## ⚠️  Erreur lors de l'exécution des tests dbt" if RUN_TESTS
    else "## ⚠️  Erreur lors de l'exécution des transformations de données"
)
ERROR_MSG = "\n".join([
    ERROR_TITLE,
    "Veuillez regarder les logs pour en savoir plus :\n",
    f"- [Logs de {os.environ.get('ENVIRONMENT')}]({os.environ.get('SCALINGO_LOGS_URL')})"
])

JOBS_TO_RUN={}
if (RUN_TESTS):
    JOBS_TO_RUN = [
        'scripts/run_tests.sh'
    ]
elif (RUN_FULL_DATAJOBS):
    JOBS_TO_RUN = [
        'scripts/0_dbt_deps.sh',
        'scripts/0_init_elementary.sh',
        'scripts/4_seed_private.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]
else:
    JOBS_TO_RUN = [
        'scripts/0_dbt_deps.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]

def run_datajobs() -> int:
    if RUN_FULL_DATAJOBS: print(" !! RUN_FULL_DATAJOBS=true : Exécution des datajobs en mode FULL")
    print("> Exécution des datajobs suivants:", JOBS_TO_RUN)
    # Select jobs to run for current env
    for file in JOBS_TO_RUN:
        returncode = subprocess.Popen(["uv", "run", file], stdin=subprocess.PIPE).wait()
        if returncode > 0:
            notify(ERROR_MSG)
            sys.exit(returncode)

    return returncode

if __name__ == '__main__':
    sys.exit(run_datajobs())  # next section explains the use of sys.exit
