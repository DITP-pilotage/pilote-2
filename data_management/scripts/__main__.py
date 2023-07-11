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
    truncate_public_tables = sys.argv[1]
    if truncate_public_tables == 'False':
        print("Execution des datajobs SANS truncate les tables public")
        for file in [
            'scripts/0_install_dbt_deps.sh',
            'scripts/1_dump_dfakto.sh',
            'scripts/2_fill_tables_ppg_metadata.sh',
            'scripts/5_fill_tables_staging.sh',
            'scripts/7_fill_tables_public.sh'
        ]:
            shellscript = subprocess.Popen([file], stdin=subprocess.PIPE)
            returncode = shellscript.wait()
            if_error_print_it_and_exit(returncode)

        return returncode
    else:
        print("Execution des datajobs AVEC truncate les tables public")
        for file in [
            'scripts/0_install_dbt_deps.sh',
            'scripts/1_dump_dfakto.sh',
            'scripts/2_fill_tables_ppg_metadata.sh',
            'scripts/5_fill_tables_staging.sh',
            'scripts/7_fill_tables_public_with_truncate.sh'
        ]:
            shellscript = subprocess.Popen([file], stdin=subprocess.PIPE)
            returncode = shellscript.wait()
            if_error_print_it_and_exit(returncode)

        return returncode


if __name__ == '__main__':
    sys.exit(main())  # next section explains the use of sys.exit
