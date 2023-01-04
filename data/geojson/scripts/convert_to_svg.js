const { readFileSync, writeFileSync } = require('fs');

// Crée le convertisseur geojson vers svg
const geojson2svg = require('geojson2svg');

const LARGEUR = 110; // svg output coords
const HAUTEUR = 100; // svg output coords
const LISTE_MÉTADONNÉES = ['dep', 'reg', 'libgeo']

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
const proj4 = require('proj4')
const reproject = require('reproject')
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

// Récupère les fichiers geojson d'entrée
const geojsonCheminDAccès = process.argv[2];
const geojsonNomDeFichierSansExtension = geojsonCheminDAccès.replace(/\.[^/.]+$/, "");

const geojsonDonnées = JSON.parse(
  readFileSync(`${__dirname}/../02_repositionné/${geojsonCheminDAccès}`, 'utf8')
)

// Change la projection géographique vers celle souhaitée
const geojsonGallPeters = reproject.reproject(
  geojsonDonnées, 'EPSG:4326', 'Gall-Peters', proj4.defs
);

// Applique la conversion vers le svg
const svgPaths = convertisseur
  .convert(geojsonGallPeters, {})
  .join('\n');

// Construit le fichier svg
const svg = `
  <svg
    viewBox="0 0 ${LARGEUR} ${HAUTEUR}"
    xmlns="http://www.w3.org/2000/svg"
    fill="#a84"
  >
    <polygon points="0,0 0,${HAUTEUR} ${LARGEUR},${HAUTEUR} ${LARGEUR},0" fill="#adf"/>
    ${svgPaths}
  </svg>
`;

// Ecrit le fichier svg
writeFileSync(`${__dirname}/../03_converti_svg/${geojsonNomDeFichierSansExtension}.svg`, svg);
