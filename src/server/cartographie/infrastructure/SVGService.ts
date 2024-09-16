import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SVG_FILEPATH = join(process.cwd(), '/src/server/cartographie/domain/france-pilote.svg');

export const loadSvgAsJson = function (): 
{ svg: { defs: any, g: { path: { 'attr-d': string, 'attr-territoire-code': string }[] } } } {
  // 1- Read SVG
  let sourceSvg = readFileSync(SVG_FILEPATH).toString();
  // 2- Parse as JSON
  const sourceParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: 'attr-', // you have assign this so use this to access the attribute
  });
  // 3- Convert SVG to JSON format
  let sourceSvgAsJson : { svg: { defs: any, g: { path: { 'attr-d': string, 'attr-territoire-code': string }[] } } } = sourceParser.parse(sourceSvg);
  return sourceSvgAsJson;
};
