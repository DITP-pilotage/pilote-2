const { readFileSync, writeFileSync } = require('fs');

// Init converter
const geojson2svg = require('geojson2svg');

const WIDTH = 110; // svg output coords
const HEIGHT = 100; // svg output coords
const METADATA_LIST = ['dep', 'reg', 'libgeo']

const converter = geojson2svg({
  attributes: METADATA_LIST.map(metadataPropName => ({
    property: `properties.${metadataPropName}`,
    type: 'dynamic',
    key: `data-${metadataPropName}`
  })),
  viewportSize: { width: WIDTH, height: HEIGHT },
  //mapExtent: {left: -5.2, bottom: 41.3, right: 9.6, top: 51.12}, // bounding box of France (GPS coords)
  mapExtent: { left: -405000, bottom: 5910000, right: 765000, top: 6980000 }, // bounding box of France (meters)
});

// Init projection helpers
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

// Get input file
const geojsonInputFilePath = process.argv[2];
const geojsonInputFileStem = geojsonInputFilePath.replace(/\.[^/.]+$/, "");

const geojson4326 = JSON.parse(
  readFileSync(`${__dirname}/../02_repositionné/${geojsonInputFilePath}`, 'utf8')
)

// Change map projection
const geojsonGallPeters = reproject.reproject(
  geojson4326, 'EPSG:4326', 'Gall-Peters', proj4.defs
);

// Retrieve svg path tags
const svgPaths = converter
  .convert(geojsonGallPeters, {})
  .join('\n');

// Build svg file
const svg = `
  <svg
    viewBox="0 0 ${WIDTH} ${HEIGHT}"
    xmlns="http://www.w3.org/2000/svg"
    fill="#a84"
  >
    <polygon points="0,0 0,${HEIGHT} ${WIDTH},${HEIGHT} ${WIDTH},0" fill="#adf"/>
    ${svgPaths}
  </svg>
`;

// Write Svg file
writeFileSync(`${__dirname}/../03_converti_svg/${geojsonInputFileStem}.svg`, svg);
