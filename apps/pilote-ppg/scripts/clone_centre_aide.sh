# Uniquement sur du local
if [ -z $CENTREAIDE_GITHUB_BRANCH ] || [ -z $CENTREAIDE_GITHUB_TOKEN ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variables. Exiting"
    exit 1
  fi
fi

rm -rf /tmp/centreaide src/content
git clone --depth 1 --branch $CENTREAIDE_GITHUB_BRANCH --single-branch https://$CENTREAIDE_GITHUB_TOKEN@github.com/DITP-pilotage/centre-aide-pilote-2.git /tmp/centreaide
mkdir src/content
cp -r /tmp/centreaide/* src/content
