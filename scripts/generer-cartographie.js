const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const svg = fs.readFileSync(
  path.join(__dirname, "../public/img/cartographie-vue-regions.svg"),
  "utf8",
);

const sourceParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "attr-",
});

console.log(JSON.stringify(sourceParser.parse(svg), null, 2));
