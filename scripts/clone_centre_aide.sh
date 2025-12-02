rm -rf /tmp/centreaide src/pages/centre-aide-pilote-2
git clone --depth 1 --branch main --single-branch https://github.com/DITP-pilotage/centre-aide-pilote-2.git /tmp/centreaide
mkdir src/pages/centre-aide-pilote-2
cp -r /tmp/centreaide/* src/pages/centre-aide-pilote-2
