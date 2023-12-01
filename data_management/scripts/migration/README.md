## Migration données de prod vers local

Pour mettre à jour pilote en local avec la prod:
- supprimer les 4 schemas: `DROP SCHEMA df3 marts public raw_data CASCADE;`
- script 0 et 1 et 2: `/bin/bash scripts/0_prisma_migrate.sh && /bin/bash scripts/1_dump_dfakto.sh && /bin/bash scripts/2_fill_tables_ppg_metadata.sh`
- exporter la prod: `/bin/bash dump_prod.sh`
- importer en local: `/bin/bash load_to_local.sh`
- ajout utilisateur ditp_admin `INSERT INTO public.utilisateur (id,email,nom,prenom,profil_code,auteur_modification,date_modification,fonction) VALUES ('46eb7569-0644-4ada-be98-abc1e417af57','ditp.admin@example.com','ditp','admin','DITP_ADMIN','Import CSV','2023-06-16 14:21:33.142',NULL);`
- script 5 et 7: `/bin/bash scripts/5_fill_tables_staging.sh && /bin/bash scripts/7_fill_tables_public.sh`
