echo "> Scalingo login"
scalingo login --api-token $API_TOKEN_SCALINGO


echo "> Scalingo db-tunnel"
pushd .
nohup scalingo --region $SCALINGO_REGION -a $SCALINGO_APP db-tunnel -p $SCALINGO_PORT_BIND SCALINGO_POSTGRESQL_URL > /logit 2>&1 &
serverPID=$!
echo "> Wait 3s for tunnel to be set up"
sleep 3
echo "> Start descente de prod"
chmod +x descente_de_prod_partielle.sh
/bin/bash descente_de_prod_partielle.sh
echo "> Close db-tunnel"
kill $serverPID
popd

