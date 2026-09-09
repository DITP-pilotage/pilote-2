import type { $Enums } from "@prisma/client";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

export type ContexteChantier = {
  territoireCode?: string;
  jalon?: number;
};

const TERRITOIRE_NATIONAL = "NAT-FR";

const resoudreTerritoire = ({
  chantier,
  contexte,
}: {
  chantier: ChantierCite;
  contexte: ContexteChantier;
}): string => {
  const { territoireCode } = contexte;
  if (!territoireCode) return TERRITOIRE_NATIONAL;
  if (!chantier.maillesApplicables) return territoireCode;

  const [maille] = territoireCode.split("-");
  return chantier.maillesApplicables.includes(maille as $Enums.Maille)
    ? territoireCode
    : TERRITOIRE_NATIONAL;
};

export const construireUrlChantier = ({
  chantier,
  contexte,
}: {
  chantier: ChantierCite;
  contexte: ContexteChantier;
}): string => {
  const territoireCode = resoudreTerritoire({ chantier, contexte });
  const chemin = `/chantier/${chantier.id}/${territoireCode}`;
  return contexte.jalon ? `${chemin}?jalon=${contexte.jalon}` : chemin;
};
