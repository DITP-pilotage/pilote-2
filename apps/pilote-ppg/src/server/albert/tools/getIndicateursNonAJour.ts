import { tool } from "ai";
import { z } from "zod";
import type {
  ChantierIndicateursNonAJour,
  RecupererIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";
import type {
  GetIndicateurContexteQuery,
  IndicateurContexteResult,
} from "@/server/chantiers/query/GetIndicateurContexteQuery";

export const getIndicateursNonAJourInputSchema = z.object({
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
    ),
  indicateur_ids: z
    .array(z.string())
    .optional()
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
  _output_instructions: string;
};

function nonEmpty(ids: string[] | undefined): string[] | undefined {
  return ids && ids.length > 0 ? ids : undefined;
}

function buildInaccessiblesInstruction(
  libelle: "chantiers" | "indicateurs",
  idsInaccessibles: string[],
): string[] {
  return idsInaccessibles.length > 0
    ? [
        `Ces ${libelle} demandés ne sont pas accessibles à l'utilisateur : ${idsInaccessibles.join(", ")}. Dis-le sans rien affirmer d'autre à leur sujet, et ne les présente jamais comme à jour.`,
      ]
    : [];
}

const AUCUN_RESULTAT_INSTRUCTION =
  "Aucun indicateur non à jour n'a été trouvé sur le périmètre demandé. Dis-le en ces termes, sans conclure que les données sont à jour : l'indicateur peut ne pas être suivi sur ce territoire, ne pas appartenir au chantier demandé, ou son identifiant peut être erroné. Propose d'élargir le périmètre, ou de vérifier l'identifiant de l'indicateur avec search_indicateurs.";

function buildOutputInstructions({
  isDetailed,
  aucunResultat,
  chantierIdsInaccessibles,
  indicateurIdsInaccessibles,
}: {
  isDetailed: boolean;
  aucunResultat: boolean;
  chantierIdsInaccessibles: string[];
  indicateurIdsInaccessibles: string[];
}): string {
  const inaccessibles = [
    ...buildInaccessiblesInstruction("chantiers", chantierIdsInaccessibles),
    ...buildInaccessiblesInstruction("indicateurs", indicateurIdsInaccessibles),
  ];

  if (aucunResultat) {
    return [AUCUN_RESULTAT_INSTRUCTION, ...inaccessibles].join("\n\n");
  }

  return [
    'Présente chaque chantier au format "CH-XXX — Nom du chantier" et chaque indicateur au format "IND-XXX — Nom de l\'indicateur".',
    "Si la question porte sur les chantiers (« sur quels chantiers… »), liste les chantiers avec leur nombre d'indicateurs non à jour, sans détailler les indicateurs, puis propose le détail d'un chantier.",
    "Sinon, regroupe par chantier puis par indicateur, avec une ligne par maille au format « Départements : 12 / 101 territoires en retard » (« Régions » pour REG, « National » pour NAT).",
    "Si l'utilisateur demande pourquoi une donnée n'est pas à jour, explique que la date théorique de mise à jour (date de la dernière valeur + periodicite + delaiDisponibiliteMois déclarés pour l'indicateur) est dépassée.",
    isDetailed
      ? "Liste les territoires en retard avec la date à laquelle la mise à jour était attendue (miseAJourAttendueDepuis). Un territoire dont dateDerniereValeur est null n'a jamais eu de valeur renseignée : présente-le comme « aucune valeur renseignée ». Si miseAJourAttendueDepuis est null alors que dateDerniereValeur est renseignée, la périodicité ou le délai de mise à jour de l'indicateur n'est pas déclaré : dis-le au lieu d'afficher une date."
      : "Le détail par territoire n'est pas inclus. Propose à l'utilisateur de cibler un indicateur ou un territoire pour obtenir la liste des territoires en retard. Ne classe pas les territoires entre eux : cette information n'est pas disponible.",
    ...inaccessibles,
  ].join("\n\n");
}

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
  recupererIndicateursNonAJourQuery,
  getIndicateurContexteQuery,
}: {
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
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
      description: `Liste les indicateurs dont les données ne sont pas à jour (retard de mise à jour), par chantier, indicateur et maille, avec le nombre de territoires en retard.

Une donnée est non à jour quand sa date théorique de mise à jour (dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur est applicable.

Utilise cet outil pour : « indicateurs non à jour », « retard de mise à jour », « données pas à jour », « données périmées », « mise à jour attendue », « territoires qui n'ont pas mis à jour l'indicateur X ».

⚠️ N'utilise PAS cet outil pour les chantiers « en retard » au sens de l'avancement (écart à la médiane) : c'est get_chantiers(view='en_retard').

Le détail nominatif des territoires en retard n'est renvoyé que si indicateur_ids ou territoire_code est fourni ; sinon seuls les compteurs par maille sont renvoyés.`,
      inputSchema: getIndicateursNonAJourInputSchema,
      execute: async (
        input: GetIndicateursNonAJourInput,
      ): Promise<GetIndicateursNonAJourOutput> => {
        if (
          input.territoire_code &&
          !territoiresAccessibles.includes(input.territoire_code)
        ) {
          return {
            resultats: [],
            acces_refuse: true,
            _output_instructions:
              "L'utilisateur n'a pas accès à ce territoire. Explique-le poliment sans donner de détail sur les données du territoire.",
          };
        }

        if (!input.territoire_code && territoiresAccessibles.length === 0) {
          return {
            resultats: [],
            _output_instructions:
              "L'utilisateur n'a accès à aucun territoire : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        const requestedChantierIds = nonEmpty(input.chantier_ids);
        const chantierIdsInaccessibles = (requestedChantierIds ?? []).filter(
          (chantierId) => !chantiersAccessibles.includes(chantierId),
        );
        const chantierIds = requestedChantierIds
          ? requestedChantierIds.filter(
              (chantierId) => !chantierIdsInaccessibles.includes(chantierId),
            )
          : chantiersAccessibles;

        if (chantierIds.length === 0) {
          return {
            resultats: [],
            _output_instructions: requestedChantierIds
              ? "Aucun des chantiers demandés n'est accessible pour cet utilisateur."
              : "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        const requestedIndicateurIds = nonEmpty(input.indicateur_ids);
        const contextesIndicateurs = await Promise.all(
          (requestedIndicateurIds ?? []).map((indicateurId) =>
            getIndicateurContexteQuery.execute({ indicateurId }),
          ),
        );
        const indicateurIdsInaccessibles = indicateursInaccessibles(
          contextesIndicateurs,
          chantiersAccessibles,
        );
        const indicateurIds = requestedIndicateurIds?.filter(
          (indicateurId) => !indicateurIdsInaccessibles.includes(indicateurId),
        );

        if (indicateurIds?.length === 0) {
          return {
            resultats: [],
            _output_instructions:
              "Aucun des indicateurs demandés n'est accessible pour cet utilisateur.",
          };
        }

        const isDetailed = Boolean(indicateurIds || input.territoire_code);
        const resultats = await recupererIndicateursNonAJourQuery.execute({
          chantierIds,
          territoireCodes: input.territoire_code
            ? [input.territoire_code]
            : territoiresAccessibles,
          indicateurIds,
          avecDetailTerritoires: isDetailed,
        });

        return {
          resultats,
          _output_instructions: buildOutputInstructions({
            isDetailed,
            aucunResultat: resultats.length === 0,
            chantierIdsInaccessibles,
            indicateurIdsInaccessibles,
          }),
        };
      },
    });
  };
}
