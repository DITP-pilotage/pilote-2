
bash scripts/ddp_restore.sh
bash scripts/anonymisation_utilisateurs.sh
# ou ddp via docker avec: "docker compose run --rm ddp bash docker/entrypoint.ddp.sh"
#   pré-requis: mettre des clés ssh dans pilote-2/docker (voir pilote-2/docker/.gitignore) 
#       pour que le tunnel vers la db soit fait dans le container (Colin)
echo ">> Run dj prod"
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
