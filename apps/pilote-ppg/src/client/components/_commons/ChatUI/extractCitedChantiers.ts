import type { $Enums } from "@prisma/client";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type CitedChantier = {
  id: string;
  nom: string;
  maillesApplicables?: $Enums.Maille[];
};

export const extractCitedChantiers = (
  messages: PiloteUIMessage[],
): Map<string, CitedChantier> => {
  const chantiers = new Map<string, CitedChantier>();

  const add = (chantier: CitedChantier) => {
    const existing = chantiers.get(chantier.id);
    if (existing?.maillesApplicables && !chantier.maillesApplicables) return;
    chantiers.set(chantier.id, chantier);
  };

  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (!("state" in part) || part.state !== "output-available") continue;

      if (part.type === "tool-get_chantiers") {
        for (const result of part.output.resultats) {
          for (const row of result.chantiers) {
            add({
              id: row.chantier.id,
              nom: row.chantier.nom,
              maillesApplicables: row.chantier.mailles_applicables,
            });
          }
        }
      }

      if (part.type === "tool-search_chantiers") {
        for (const chantier of part.output.chantiers) {
          add({ id: chantier.id, nom: chantier.nom });
        }
      }

      if (part.type === "tool-search_indicateurs") {
        for (const indicateur of part.output.indicateurs) {
          add({ id: indicateur.chantier.id, nom: indicateur.chantier.nom });
        }
      }
    }
  }

  return chantiers;
};
