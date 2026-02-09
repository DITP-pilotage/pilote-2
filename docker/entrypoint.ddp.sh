RUN_DUMP=false

if [ "$RUN_DUMP" = "true" ]; then
    echo "RUN prod dump"
    eval $(ssh-agent)
    scalingo --region osc-secnum-fr1 -a prod-pilote-ditp db-tunnel -p 10003 SCALINGO_POSTGRESQL_URL &
    sleep 5
    bash scripts/ddp_dump.sh
    # close tunnel
    kill %1
else
    echo "SKIP prod dump"
fi

echo "Restore data to $CONN_STR_DEST"
bash scripts/ddp_restore.sh
bash scripts/anonymisation_utilisateurs.sh