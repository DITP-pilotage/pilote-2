import sys
import subprocess
from notify import notify


def if_error_print_it_and_exit(returncode):
    if returncode > 0:
        # notify
        notify('## ⚠️  Erreur lors de l\'exécution des transformations de données\n'
               'Veuillez regarder les logs pour en savoir plus :\n\n'
               '- [Logs de DEV](https://dashboard.scalingo.com/apps/osc-secnum-fr1/dev-datajobs-ditp/logs) \n'
               '- [Logs de PROD](https://dashboard.scalingo.com/apps/osc-secnum-fr1/prod-datajobs-ditp/logs)\n'
               )
        sys.exit(returncode)


def main() -> int:
    shellscript = subprocess.Popen(['scripts/1_dump_dfakto.sh'], stdin=subprocess.PIPE)
    returncode = shellscript.wait()
    if_error_print_it_and_exit(returncode)

    shellscript = subprocess.Popen(['scripts/2_fill_tables_ppg_metadata.sh'], stdin=subprocess.PIPE)
    returncode = shellscript.wait()
    if_error_print_it_and_exit(returncode)

    shellscript = subprocess.Popen(['scripts/5_fill_tables_staging.sh'], stdin=subprocess.PIPE)
    returncode = shellscript.wait()
    if_error_print_it_and_exit(returncode)

    shellscript = subprocess.Popen(['scripts/7_fill_tables_public.sh'], stdin=subprocess.PIPE)
    returncode = shellscript.wait()
    if_error_print_it_and_exit(returncode)

    return returncode


if __name__ == '__main__':
    sys.exit(main())  # next section explains the use of sys.exit
