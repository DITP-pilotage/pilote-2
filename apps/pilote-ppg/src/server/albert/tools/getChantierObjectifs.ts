import { tool } from "ai";
import { texteDepuisHtml } from "@/server/albert/tools/texteDepuisHtml";
import { z } from "zod";
import { chantierIdSchema } from "@/server/albert/tools/chantierId";
import { GetChantierObjectifsQuery } from "@/server/chantiers/query/GetChantierObjectifsQuery";
import type { GetChantierObjectifsResult } from "@/server/chantiers/query/GetChantierObjectifsQuery";
import { personReference } from "@/shared/personne/personReference";

export const getChantierObjectifsInputSchema = z.object({
  chantier_id: chantierIdSchema,
});

type ObjectifRenvoye = {
  date_publication: string;
  contenu: string;
  auteur: string;
  modifie_par?: string;
};

export type GetChantierObjectifsOutput = {
  chantier_id: string;
  objectifs: Record<
    keyof GetChantierObjectifsResult["objectifs"],
    ObjectifRenvoye | null
  >;
};

export function createGetChantierObjectifsTool({
  getChantierObjectifsQuery,
}: {
  getChantierObjectifsQuery: GetChantierObjectifsQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({
      description: `Renvoie les objectifs publiés d'un chantier, définis au niveau national et non par territoire :
- \`notre_ambition\` : l'ambition du chantier, ses objectifs, indicateurs et leviers ;
- \`deja_fait\` : les principales avancées réalisées ;
- \`a_faire\` : les objectifs prioritaires et les actions restant à mener.
Un champ \`null\` : aucun objectif publié de ce type.
- \`auteur\` (et \`modifie_par\` quand une autre personne l'a modifié) : la référence de la personne, à recopier telle quelle pour la citer.
Utilise-le pour : l'ambition d'un chantier, ses objectifs, ce qui a été fait, ce qu'il reste à faire, sa feuille de route.
Ne l'utilise pas pour : les commentaires d'un territoire (freins, actions, résultats) → get_chantier_commentaires.`,
      inputSchema: getChantierObjectifsInputSchema,
      execute: async (input): Promise<GetChantierObjectifsOutput> => {
        if (!chantiersAccessibles.includes(input.chantier_id)) {
          throw new Error(
            `Accès non autorisé au chantier ${input.chantier_id}`,
          );
        }

        const result = await getChantierObjectifsQuery.execute(
          input.chantier_id,
        );

        const enTexte = (
          objectif: (typeof result.objectifs)["a_faire"],
        ): ObjectifRenvoye | null =>
          objectif && {
            date_publication: objectif.date_publication,
            contenu: texteDepuisHtml({ html: objectif.contenu }),
            auteur: personReference(objectif.auteur_creation_id),
            ...(objectif.auteur_modification_id !==
              objectif.auteur_creation_id && {
              modifie_par: personReference(objectif.auteur_modification_id),
            }),
          };

        return {
          chantier_id: result.chantier_id,
          objectifs: {
            notre_ambition: enTexte(result.objectifs.notre_ambition),
            deja_fait: enTexte(result.objectifs.deja_fait),
            a_faire: enTexte(result.objectifs.a_faire),
          },
        };
      },
    });
  };
}
