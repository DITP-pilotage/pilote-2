import { readFile, readFileSync, writeFileSync } from "fs";

const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");

export const loadSvgAsJson = function(svgFilePath: string): 
  {svg: {defs: any, g: {path: {"attr-d": string, "attr-territoire-code": string}[]}}} {
    // 1- Read SVG
  let sourceSvg = readFileSync(svgFilePath).toString();
  // 2- Parse as JSON
  const sourceParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: 'attr-', // you have assign this so use this to access the attribute
  });
  let sourceSvgAsJson : {svg: {defs: any, g: {path: {"attr-d": string, "attr-territoire-code": string}[]}}}= sourceParser.parse(sourceSvg);
  return sourceSvgAsJson
}
// 1- Read SVG
// 2- Parse as JSON

let sourceSvgAsJson : {svg: {defs: any, g: {path: {"attr-d": string, "attr-territoire-code": string}[]}}}= loadSvgAsJson('Territoires_jfg_avec_dept_id.svg')

console.log(sourceSvgAsJson.svg.g.path);

// 3- Extract territoires
let sourceSvgTerritoires : {"attr-d": string, "attr-territoire-code": string}[] = sourceSvgAsJson.svg.g.path;

const getFillColor = function(code_) { return "#aeaedc"};
const getClassToApply = function(code_: string) { 
  if ((new RegExp('^DEPT-', 'g')).test(code_))return "territoire-rempli territoire-interactif"
  else if ((new RegExp('^REG-', 'g')).test(code_)) return "territoire-frontière"
  else "aucun"
  };

const SVG_VIEWBOX = ""
// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
const SVG_DEFS = [{
  "hachuresGrisBlanc": {
    pattern: {
      "attr-height": "1", "attr-width": "1",
      "attr-id": "hachures-gris-blanc",
      "attr-patternTransform": "rotate(45)",
      "attr-patternUnits": "userSpaceOnUse"},
    line: { "attr-stroke-width": "0.75", "attr-y2": "1"}}
  }]

// 4- Build destination Json object
let destinationSvgAsJson = {
  svg: {
    "attr-xmlns": "http://www.w3.org/2000/svg",
    "attr-version": "1.2",
    "attr-viewBox": SVG_VIEWBOX,
    defs: SVG_DEFS,
    g: {
      "attr-class": "canvas",
      path: sourceSvgTerritoires.map(e => ({
        "attr-territoire-code": e["attr-territoire-code"], 
        "attr-d": e["attr-d"],
        "attr-fill": getFillColor(e["attr-territoire-code"]),
        "attr-class": getClassToApply(e["attr-territoire-code"])
      }))
  }}
}

// 5- Build destination SVG object
const destinationSvg = (new XMLBuilder({
  attributeNamePrefix: "attr-",
  ignoreAttributes : false
})).build(destinationSvgAsJson);
console.log(destinationSvg)

writeFileSync("out.svg", destinationSvg)





export const getTraceSvg = function(svgAsJson: {svg: {g: {path: {"attr-d": string, "attr-territoire-code": string}[]}}},  territoireCode: string): string {
  return svgAsJson.svg.g.path.find(e => e["attr-d"]=territoireCode)?.["attr-territoire-code"] || "";
}
