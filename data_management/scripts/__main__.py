import sys
import os
import subprocess
from notify import notify


"""
Exemple d'utilisation :

$  python3 scripts/__main__.py
"""

# Environnement d'exécution. Il peut être forcé avec l'env var FORCE_ENVIRONMENT_DATAJOBS
SELECTED_ENV = os.environ.get('FORCE_ENVIRONMENT_DATAJOBS') or os.environ.get('ENVIRONMENT')
# Message d'erreur généré en cas de  problème lors de l'exécution des jobs
ERROR_MSG = "\n".join([
    f"## ⚠️  Erreur lors de l'exécution des transformations de données",
    f"Veuillez regarder les logs pour en savoir plus :\n",
    f"- [Logs de {SELECTED_ENV}]({os.environ.get('SCALINGO_LOGS_URL')})"
])

# Jobs à exécuter en fonction de l'environnement
JOBS_TO_RUN={}
JOBS_TO_RUN['PRODUCTION'] = [
        'scripts/0_dbt_deps.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]
JOBS_TO_RUN['PREPROD'] = JOBS_TO_RUN['PRODUCTION']
JOBS_TO_RUN['DEV'] = [
        'scripts/0_dbt_deps.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]
JOBS_TO_RUN['LOCAL'] = [
        'scripts/0_dbt_deps.sh',
        'scripts/0_prisma_migrate.sh',
        'scripts/2_seed_ppg_metadata.sh',
        'scripts/4_seed_private.sh',
        'scripts/5_staging.sh',
        'scripts/7_exposition.sh'
    ]


def run_datajobs() -> int:
    notify(ERROR_MSG)
    print("Message sent")
    sys.exit(1)
    if os.environ.get('FORCE_ENVIRONMENT_DATAJOBS'): print("> ATTENTION: Environnement forcé sur", os.environ.get('FORCE_ENVIRONMENT_DATAJOBS'))
    print('> Environnement détecté:', SELECTED_ENV)
    print("> Exécution des datajobs suivants:", JOBS_TO_RUN[SELECTED_ENV])
    # Select jobs to run for current env
    for file in JOBS_TO_RUN[SELECTED_ENV]:
        returncode = subprocess.Popen([file], stdin=subprocess.PIPE).wait()
        if returncode > 0:
            notify(ERROR_MSG)
            sys.exit(returncode)

    return returncode

if __name__ == '__main__':
    sys.exit(run_datajobs())  # next section explains the use of sys.exit
