import { tool } from "ai";
import { z } from "zod";
import type {
  ChantierIndicateursNonAJour,
  GetIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type {
  GetIndicateurContexteQuery,
  IndicateurContexteResult,
} from "@/server/chantiers/query/GetIndicateurContexteQuery";

export const getIndicateursNonAJourInputSchema = z.object({
  chantier_ids: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
    ),
  indicateur_ids: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      "Identifiants d'indicateurs (ex: ['IND-894']). Si l'indicateur est décrit sans identifiant, résous-le d'abord avec search_indicateurs.",
    ),
  territoire_code: z
    .string()
    .optional()
    .describe(
      "Code d'un territoire (ex: NAT-FR, REG-53, DEPT-29) pour restreindre la recherche à ce seul territoire.",
    ),
});

type GetIndicateursNonAJourInput = z.infer<
  typeof getIndicateursNonAJourInputSchema
>;

export type GetIndicateursNonAJourOutput = {
  resultats: ChantierIndicateursNonAJour[];
  acces_refuse?: boolean;
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
};

function indicateursInaccessibles(
  contextes: (IndicateurContexteResult | null)[],
  chantiersAccessibles: string[],
): string[] {
  return contextes.flatMap((contexte) =>
    contexte && !chantiersAccessibles.includes(contexte.chantier.id)
      ? [contexte.id]
      : [],
  );
}

export function createGetIndicateursNonAJourTool({
  getIndicateursNonAJourQuery,
  getIndicateurContexteQuery,
}: {
  getIndicateursNonAJourQuery: GetIndicateursNonAJourQuery;
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie les indicateurs dont les données ne sont pas à jour, par chantier, indicateur et maille, avec le nombre de territoires en retard de mise à jour. Une donnée n'est pas à jour quand sa date théorique de mise à jour (date de la dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur s'applique.
- Le détail par territoire n'est renvoyé qu'avec \`indicateur_ids\` ou \`territoire_code\` ; sinon, seulement les compteurs par maille.
- Liste vide : aucun indicateur non à jour trouvé sur ce périmètre, ce qui ne prouve pas que les données sont à jour (l'indicateur peut ne pas être suivi ici, ou son identifiant être erroné).
- \`dateDerniereValeur\` null : aucune valeur n'a jamais été renseignée sur ce territoire.
- \`miseAJourAttendueDepuis\` null alors que \`dateDerniereValeur\` est renseignée : la date théorique n'a pas pu être calculée.
- \`acces_refuse\` : l'utilisateur n'a accès ni à ce territoire, ni à aucun des chantiers ou indicateurs demandés.
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme à jour.
Utilise-le pour : « indicateurs non à jour », « retard de mise à jour », « données périmées », « territoires qui n'ont pas mis à jour l'indicateur X ».
Ne l'utilise pas pour : les chantiers en retard au sens de l'avancement (écart à la médiane) → get_chantiers (view "en_retard").`,
      inputSchema: getIndicateursNonAJourInputSchema,
      execute: async (
        input: GetIndicateursNonAJourInput,
      ): Promise<GetIndicateursNonAJourOutput> => {
        if (
          input.territoire_code &&
          !territoiresAccessibles.includes(input.territoire_code)
        ) {
          return { resultats: [], acces_refuse: true };
        }

        if (!input.territoire_code && territoiresAccessibles.length === 0) {
          return { resultats: [], acces_refuse: true };
        }

        const chantiersDemandes = input.chantier_ids.length > 0;
        const chantierIdsInaccessibles = input.chantier_ids.filter(
          (chantierId) => !chantiersAccessibles.includes(chantierId),
        );
        const chantierIds = chantiersDemandes
          ? input.chantier_ids.filter(
              (chantierId) => !chantierIdsInaccessibles.includes(chantierId),
            )
          : chantiersAccessibles;

        if (chantierIds.length === 0) {
          return { resultats: [], acces_refuse: true };
        }

        const indicateursDemandes = input.indicateur_ids.length > 0;
        const contextesIndicateurs = await Promise.all(
          input.indicateur_ids.map((indicateurId) =>
            getIndicateurContexteQuery.execute({ indicateurId }),
          ),
        );
        const indicateurIdsInaccessibles = indicateursInaccessibles(
          contextesIndicateurs,
          chantiersAccessibles,
        );
        const indicateurIds = input.indicateur_ids.filter(
          (indicateurId) => !indicateurIdsInaccessibles.includes(indicateurId),
        );

        if (indicateursDemandes && indicateurIds.length === 0) {
          return { resultats: [], acces_refuse: true };
        }

        const isDetailed =
          indicateursDemandes || Boolean(input.territoire_code);
        const resultats = await getIndicateursNonAJourQuery.execute({
          chantierIds,
          territoireCodes: input.territoire_code
            ? [input.territoire_code]
            : territoiresAccessibles,
          indicateurIds: indicateursDemandes ? indicateurIds : undefined,
          avecDetailTerritoires: isDetailed,
        });

        return {
          resultats,
          ...(chantierIdsInaccessibles.length > 0 && {
            chantiers_non_accessibles: chantierIdsInaccessibles,
          }),
          ...(indicateurIdsInaccessibles.length > 0 && {
            indicateurs_non_accessibles: indicateurIdsInaccessibles,
          }),
        };
      },
    });
  };
}
