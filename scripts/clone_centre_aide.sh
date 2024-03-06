# Uniquement sur du local
if [ -z $GITHUB_FOLDER ] || [ -z $GITHUB_TOKEN ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variables. Exiting"
    exit 1
  fi
fi

rm -rf /tmp/centreaide public/centreaide
git clone --depth 1 --branch retype-deploy --single-branch https://$GITHUB_TOKEN@github.com/DITP-pilotage/centre-aide-pilote.git /tmp/centreaide
mkdir public/centreaide
cp -r /tmp/centreaide/$GITHUB_FOLDER/* public/centreaide
