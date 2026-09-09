import type { $Enums } from "@prisma/client";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ChantierCite = {
  id: string;
  nom: string;
  maillesApplicables?: $Enums.Maille[];
};

export const extraireChantiersCites = (
  messages: PiloteUIMessage[],
): Map<string, ChantierCite> => {
  const chantiers = new Map<string, ChantierCite>();

  const ajouter = (chantier: ChantierCite) => {
    const existant = chantiers.get(chantier.id);
    if (existant?.maillesApplicables && !chantier.maillesApplicables) return;
    chantiers.set(chantier.id, chantier);
  };

  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (!("state" in part) || part.state !== "output-available") continue;

      if (part.type === "tool-get_chantiers") {
        for (const resultat of part.output.resultats) {
          for (const ligne of resultat.chantiers) {
            ajouter({
              id: ligne.chantier.id,
              nom: ligne.chantier.nom,
              maillesApplicables: ligne.chantier.mailles_applicables,
            });
          }
        }
      }

      if (part.type === "tool-search_chantiers") {
        for (const chantier of part.output.chantiers) {
          ajouter({ id: chantier.id, nom: chantier.nom });
        }
      }

      if (part.type === "tool-search_indicateurs") {
        for (const indicateur of part.output.indicateurs) {
          ajouter({ id: indicateur.chantier.id, nom: indicateur.chantier.nom });
        }
      }
    }
  }

  return chantiers;
};
