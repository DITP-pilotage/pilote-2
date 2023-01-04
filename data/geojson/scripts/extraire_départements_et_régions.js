/**
 * Extrait la liste des départements et des régions
 * à partir des données des fichiers geojson
 */

const { readFileSync, writeFileSync } = require('fs');

const fichierRégions = 'a-reg2021.json';
const fichierDépartements = 'a-dep2021.json';

// Lit les fichiers geojson
const régions = JSON.parse(
  readFileSync(`${__dirname}/../01_original/${fichierRégions}`, 'utf8')
);

const départements = JSON.parse(
  readFileSync(`${__dirname}/../01_original/${fichierDépartements}`, 'utf8')
);

// Récupère les métadonnées des géométries
régionsMetadonnées = régions.features.map(région => région.properties)
départementsMétadonnées = départements.features.map(département => département.properties)

// Crée les fichiers JSON
writeFileSync(`${__dirname}/../régions.json`, JSON.stringify(régionsMetadonnées));
writeFileSync(`${__dirname}/../départements.json`, JSON.stringify(départementsMétadonnées));
