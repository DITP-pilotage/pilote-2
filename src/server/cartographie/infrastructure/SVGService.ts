import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CartographieSVGContrat } from '@/server/cartographie/app/contrats/CartographieSVGContrat';
import { configuration } from '@/config';

const SERVER_ROOT = '/src/server/cartographie/domain/';
const SVG_FILEPATH = join(process.cwd(), SERVER_ROOT, configuration.cartographie.svgPath);
const PREFIX_ATTR_SVG = 'attr-';

// eslint-disable-next-line unicorn/no-static-only-class
export class SVGService {
  static loadSvgAsJson(): CartographieSVGContrat  {
    let sourceSvg = readFileSync(SVG_FILEPATH).toString();

    const sourceParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: PREFIX_ATTR_SVG,
    });
    
    return sourceParser.parse(sourceSvg) satisfies CartographieSVGContrat;
  }
}
