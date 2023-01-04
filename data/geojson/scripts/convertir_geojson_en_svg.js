/**
 * Convertit les fichiers geojson souhaités en svg
 * Les fichiers sources sont prélevés dans '02_repositionné'
 * Les fichiers créés sont écrits dans '03_converti_svg'
 */

const { readFileSync, writeFileSync } = require('fs');

const LARGEUR = 110; // svg output coords
const HAUTEUR = 100; // svg output coords
const LISTE_MÉTADONNÉES = ['dep', 'reg', 'libgeo'];
const FICHIERS_À_CONVERTIR = ['a-reg2021.json', 'a-dep2021.json'];

// Crée le convertisseur geojson vers svg
const geojson2svg = require('geojson2svg');

const convertisseur = geojson2svg({
  // Configure la propagation des métadonnées des geojson vers les svg
  attributes: LISTE_MÉTADONNÉES.map(metadataPropName => ({
    property: `properties.${metadataPropName}`,
    type: 'dynamic',
    key: `data-${metadataPropName}`
  })),

  viewportSize: { width: LARGEUR, height: HAUTEUR },

  // boîte englobante des territoires présents dans les geojson
  //mapExtent: {left: -5.2, bottom: 41.3, right: 9.6, top: 51.12}, // boîte englobante (GPS coords) de la France
  mapExtent: { left: -405000, bottom: 5910000, right: 765000, top: 6980000 }, // boîte englobante (en mètres ?) de la France
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
    readFileSync(`${__dirname}/../02_repositionné/${geojsonNomDeFichier}`, 'utf8')
  )

  // Change la projection géographique vers celle souhaitée
  const geojsonDonnéesReprojetées = reproject.reproject(
    geojsonDonnées, 'EPSG:4326', 'Gall-Peters', proj4.defs
  );

  // Applique la conversion vers le svg
  const svgPaths = convertisseur
    .convert(geojsonDonnéesReprojetées, {})
    .join('\n');

  // Construit le fichier svg
  const svg = `
    <svg
      viewBox="0 0 ${LARGEUR} ${HAUTEUR}"
      xmlns="http://www.w3.org/2000/svg"
      fill="#313178"
      stroke="#FFFFFF"
      stroke-width="0.3"
    >
      <polygon points="0,0 0,${HAUTEUR} ${LARGEUR},${HAUTEUR} ${LARGEUR},0" fill="#eee"/>
      ${svgPaths}
    </svg>
  `;

  // Ecrit le fichier svg
  writeFileSync(`${__dirname}/../03_converti_svg/${geojsonNomDeFichierSansExtension}.svg`, svg);
}

FICHIERS_À_CONVERTIR.forEach(fichier => convertirGeojson(fichier));
