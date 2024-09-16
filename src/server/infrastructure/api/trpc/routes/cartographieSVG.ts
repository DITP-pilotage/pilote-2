import { loadSvgAsJson } from '@/server/cartographie/infrastructure/SVGService';
import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';

export const cartographieSVGRouter = créerRouteurTRPC({
  récupérerCartographieSVG: procédureProtégée.query(() => loadSvgAsJson()),
});
