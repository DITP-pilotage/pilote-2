import sys
import os
import subprocess
from notify import notify


"""
Exemple d'utilisation :

$  python3 scripts/__main__.py
"""


def if_error_print_it_and_exit(returncode):
    if returncode > 0:
        notify(f"""## ⚠️  Erreur lors de l\'exécution des transformations de données\n"""
               f"""Veuillez regarder les logs pour en savoir plus :\n\n"""
               f"""- [Logs de {os.environ.get('ENVIRONMENT')}]({os.environ.get('SCALINGO_LOGS_URL')}) \n"""
               )
        sys.exit(returncode)


def main() -> int:

    print("Execution des datajobs des tables public")
    for file in [
        'scripts/0_install_dbt_deps.sh',
        'scripts/2_fill_tables_ppg_metadata.sh',
        'scripts/5_fill_tables_staging.sh',
        'scripts/7_fill_tables_public.sh'
    ]:
        shellscript = subprocess.Popen([file], stdin=subprocess.PIPE)
        returncode = shellscript.wait()
        if_error_print_it_and_exit(returncode)

    return returncode

if __name__ == '__main__':
    sys.exit(main())  # next section explains the use of sys.exit
