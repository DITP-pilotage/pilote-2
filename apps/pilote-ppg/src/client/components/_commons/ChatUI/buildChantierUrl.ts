import type { $Enums } from "@prisma/client";
import type { CitedChantier } from "@/components/_commons/ChatUI/extractCitedChantiers";

export type ChantierUrlContext = {
  territoireCode?: string;
  jalon?: number;
};

const NATIONAL_TERRITOIRE_CODE = "NAT-FR";

const resolveTerritoireCode = ({
  chantier,
  context,
}: {
  chantier: CitedChantier;
  context: ChantierUrlContext;
}): string => {
  const { territoireCode } = context;
  if (!territoireCode) return NATIONAL_TERRITOIRE_CODE;
  if (!chantier.maillesApplicables) return territoireCode;

  const [maille] = territoireCode.split("-");
  return chantier.maillesApplicables.includes(maille as $Enums.Maille)
    ? territoireCode
    : NATIONAL_TERRITOIRE_CODE;
};

export const buildChantierUrl = ({
  chantier,
  context,
}: {
  chantier: CitedChantier;
  context: ChantierUrlContext;
}): string => {
  const territoireCode = resolveTerritoireCode({ chantier, context });
  const path = `/chantier/${chantier.id}/${territoireCode}`;
  return context.jalon ? `${path}?jalon=${context.jalon}` : path;
};
