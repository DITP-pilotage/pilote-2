/**
 * Convertit les fichiers geojson souhaités en svg
 * Les fichiers sources sont prélevés dans '03_repositionné'
 * Les fichiers créés sont écrits dans '04_données_extraites'
 */

const { readFileSync, writeFileSync } = require('fs');

const HAUTEUR = 100; // hauteur du svg en sortie
const LARGEUR = 110; // largeur du svg en sortie
const FICHIERS_À_CONVERTIR = ['a-reg2021.json', 'a-dep2021.json']; // nom des fichiers d'entrée
const LISTE_MÉTADONNÉES = [{ // propriétés des 'features' du geojson à propager dans le svg final
  nomOriginal: 'dep',
  nomCible: 'département',
},{
  nomOriginal: 'reg',
  nomCible: 'région',
},{
  nomOriginal: 'libgeo',
  nomCible: 'nom',
}];

// Crée le convertisseur geojson vers svg
const geojson2svg = require('geojson2svg');

const convertisseurGeojson2svg = geojson2svg({
  // Configure la propagation des métadonnées des geojson vers les svg
  attributes: LISTE_MÉTADONNÉES.map(métadonnée => ({
    property: `properties.${métadonnée.nomOriginal}`,
    type: 'dynamic',
    key: `data-${métadonnée.nomCible}`,
  })),

  viewportSize: { width: LARGEUR, height: HAUTEUR },

  // boîte englobante des territoires présents dans les geojson
  //mapExtent: {left: -5.2, bottom: 41.3, right: 9.6, top: 51.12}, // boîte englobante (GPS coords) de la France
  mapExtent: { left: -405000, bottom: 5910000, right: 765000, top: 6980000 }, // boîte englobante (en mètres ?) de la France

  // nombre de décimales pour les coordonnées dans le svg
  precision: 1,
});

// Initialise les utilitaires pour calculer la nouvelle projection géographique
const proj4 = require('proj4');
const reproject = require('reproject');
proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
  ],
  [
    'Sphere-Robinson',
    '+proj=robin +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs'
  ],
  [
    'Gall-Peters',
    '+proj=cea +lon_0=0 +lat_ts=45 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'
  ]
]);

function convertirGeojson(geojsonNomDeFichier) {
  // Récupère les fichiers geojson d'entrée
  const geojsonNomDeFichierSansExtension = geojsonNomDeFichier.replace(/\.[^/.]+$/, "");

  const geojsonDonnées = JSON.parse(
    readFileSync(`${__dirname}/../03_repositionné/${geojsonNomDeFichier}`, 'utf8')
  )

  // Change la projection cartographique vers celle souhaitée
  const geojsonDonnéesReprojetées = reproject.reproject(
    geojsonDonnées,  // coordonnées géographiques d'origine
    'EPSG:4326',     // projection cartographique d'origine
    'Gall-Peters',   // projection cartographique cible
    proj4.defs,      // définition des projections cartographiques
  );

  // Applique la conversion vers les paths svg
  const svgPaths = convertisseurGeojson2svg
    .convert(geojsonDonnéesReprojetées, {}); // array de string html: `<path ... />`

  // Construit le fichier json de sortie
  const fichierJson = JSON.stringify(
    svgPaths.map(svgPathString => {
      // Récupérer les attributs HTML à partir de la chaîne de caractères `<path d="..." data-machin="..." >`
      const attributs = [...svgPathString.matchAll(/\s(?:data-)?([A-zÀ-ú0-9]+)=\"([^\"]*)\"/g)]
      return Object.fromEntries(
        attributs.map(attributRegexpMatch => (
          attributRegexpMatch.slice(1, 3) // seuls les deux groupes de capture Regexp nous intéressent (le nom de l'attribut et sa valeur)
        ))
      );
    })
  );

  // Construit le fichier svg
  const fichierSvg = `
    <svg
      viewBox="0 0 ${LARGEUR} ${HAUTEUR}"
      xmlns="http://www.w3.org/2000/svg"
      fill="#313178"
      stroke="#FFFFFF"
      stroke-width="0.3"
    >
      <polygon points="0,0 0,${HAUTEUR} ${LARGEUR},${HAUTEUR} ${LARGEUR},0" fill="#eee"/>
      ${svgPaths.join('\n')}
    </svg>
  `;

  // Ecrit le fichier json et le svg
  writeFileSync(`${__dirname}/../04_données_extraites/${geojsonNomDeFichierSansExtension}.json`, fichierJson);
  writeFileSync(`${__dirname}/../04_données_extraites/${geojsonNomDeFichierSansExtension}.svg`, fichierSvg);
}

FICHIERS_À_CONVERTIR.forEach(fichier => convertirGeojson(fichier));
