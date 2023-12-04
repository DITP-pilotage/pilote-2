## Migration données de prod vers local

Pour mettre à jour pilote en local avec la prod:
- supprimer les 4 schemas: `DROP SCHEMA df3 marts public raw_data CASCADE;`
- script 0 et 1 et 2: `/bin/bash scripts/0_prisma_migrate.sh && /bin/bash scripts/1_dump_dfakto.sh && /bin/bash scripts/2_fill_tables_ppg_metadata.sh`
- exporter la prod: `/bin/bash dump_prod.sh`
- importer en local: `/bin/bash load_to_local.sh`
- Se connecter avec un utilisateur de prod au profil `DITP_ADMIN`, et le mdp developpeur en local
- script 5 et 7: `/bin/bash scripts/5_fill_tables_staging.sh && /bin/bash scripts/7_fill_tables_public.sh`
