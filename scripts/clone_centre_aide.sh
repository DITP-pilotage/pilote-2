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

git clone --depth 1 --branch retype-deploy --single-branch https://$GITHUB_TOKEN@github.com/DITP-pilotage/centre-aide-pilote.git public/centreaide
cd public/centreaide
find -mindepth 1 -maxdepth 1 -type d -not -name "$GITHUB_FOLDER" -exec rm -rf {} \;
mv "$GITHUB_FOLDER"/* .
rm -r "$GITHUB_FOLDER"