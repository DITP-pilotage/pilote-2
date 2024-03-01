# Uniquement sur du local
if [ -z $GIT_FOLDER ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

git clone --depth 1 --branch retype-deploy --single-branch --filter=blob:none --sparse https://github.com/DITP-pilotage/centre-aide-pilote.git public/centreaide
cd public/centreaide
git sparse-checkout init --cone
git sparse-checkout set "$GIT_FOLDER"
mv "$GIT_FOLDER"/* .
rm -r "$GIT_FOLDER"