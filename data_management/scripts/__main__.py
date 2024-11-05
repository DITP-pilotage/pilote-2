import sys
import os
import subprocess
from notify import notify


"""
Exemple d'utilisation :

$  python3 scripts/__main__.py
"""

# Message d'erreur généré en cas de  problème lors de l'exécution des jobs
ERROR_MSG = "\n".join([
    f"## ⚠️  Erreur lors de l'exécution des transformations de données",
    f"Veuillez regarder les logs pour en savoir plus :\n",
    f"- [Logs de {os.environ.get('ENVIRONMENT')}]({os.environ.get('SCALINGO_LOGS_URL')})"
])

# Exécution de tous les jobs seulement si FULL_DJ==true
RUN_FULL_DATAJOBS = os.environ.get('FULL_DJ', "false").lower() == "true"

JOBS_TO_RUN={}
if (RUN_FULL_DATAJOBS):
    JOBS_TO_RUN = [
        'scripts/0_dbt_deps.sh',
        'scripts/0_init_elementary.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/4_seed_private.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]
else:
    JOBS_TO_RUN = [
        'scripts/0_dbt_deps.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]

def run_datajobs() -> int:
    if RUN_FULL_DATAJOBS: print(" !! RUN_FULL_DATAJOBS=true : Exécution des datajobs en mode FULL")
    print("> Exécution des datajobs suivants:", JOBS_TO_RUN)
    # Select jobs to run for current env
    for file in JOBS_TO_RUN:
        returncode = subprocess.Popen([file], stdin=subprocess.PIPE).wait()
        if returncode > 0:
            notify(ERROR_MSG)
            sys.exit(returncode)

    return returncode

if __name__ == '__main__':
    sys.exit(run_datajobs())  # next section explains the use of sys.exit
