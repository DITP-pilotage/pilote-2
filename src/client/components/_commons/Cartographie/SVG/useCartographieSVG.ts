import api from '@/server/infrastructure/api/trpc/api';

export const useCartographieSVG = () => {
  const { data: sourceSvgAsJson } = api.cartographieSVG.récupérerCartographieSVG.useQuery(undefined, { keepPreviousData: true });
  return { sourceSvgAsJson };
};
