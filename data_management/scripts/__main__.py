import sys
import os
import subprocess
from notify import notify


"""
Exemple d'utilisation :

$  python3 scripts/__main__.py
"""

ERROR_MSG = "\n".join([
    f"## ⚠️  Erreur lors de l'exécution des transformations de données",
    f"Veuillez regarder les logs pour en savoir plus :\n",
    f"- [Logs de {os.environ.get('ENVIRONMENT')}]({os.environ.get('SCALINGO_LOGS_URL')})"
])

JOBS_TO_RUN={}
JOBS_TO_RUN['PRODUCTION'] = [
        'scripts/0_install_dbt_deps.sh',
        'scripts/2_fill_tables_ppg_metadata.sh',
        'scripts/5_fill_tables_staging.sh',
        'scripts/7_fill_tables_public.sh'
    ]
JOBS_TO_RUN['PREPROD'] = JOBS_TO_RUN['PRODUCTION']
JOBS_TO_RUN['DEV'] = [
        'scripts/0_dbt_deps.sh',
        'scripts/0_prisma_migrate.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/4_seed_private.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]
JOBS_TO_RUN['LOCAL'] = JOBS_TO_RUN['DEV']


def run_datajobs() -> int:

    print("> Execution des datajobs")
    # Run jobs defined in JOBS_TO_RUN for current env
    for file in JOBS_TO_RUN[os.environ.get('ENVIRONMENT')]:
        returncode = subprocess.Popen([file], stdin=subprocess.PIPE).wait()
        if returncode > 0:
            notify(ERROR_MSG)
            sys.exit(returncode)

    return returncode

if __name__ == '__main__':
    sys.exit(run_datajobs())  # next section explains the use of sys.exit
