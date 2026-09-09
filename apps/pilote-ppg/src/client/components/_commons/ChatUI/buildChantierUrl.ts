export type ChantierUrlContext = {
  territoireCode?: string;
  jalon?: number;
};

const NATIONAL_TERRITOIRE_CODE = "NAT-FR";

export const buildChantierUrl = ({
  chantierId,
  context,
}: {
  chantierId: string;
  context: ChantierUrlContext;
}): string => {
  const territoireCode = context.territoireCode ?? NATIONAL_TERRITOIRE_CODE;
  const path = `/chantier/${chantierId}/${territoireCode}`;
  return context.jalon ? `${path}?jalon=${context.jalon}` : path;
};
