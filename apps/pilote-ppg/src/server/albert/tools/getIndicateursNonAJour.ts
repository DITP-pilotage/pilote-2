import { tool } from "ai";
import { z } from "zod";
import type { $Enums } from "@prisma/client";
import type {
  RecupererIndicateursNonAJourQuery,
  RecupererIndicateursNonAJourResult,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

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

type TerritoireEnRetardOutput = {
  code: string;
  nom: string | null;
  date_derniere_valeur: string | null;
  mise_a_jour_attendue_depuis: string | null;
};

type MailleOutput = {
  maille: $Enums.Maille;
  nb_territoires_en_retard: number;
  nb_territoires_applicables: number;
  territoires_en_retard?: TerritoireEnRetardOutput[];
};

type ChantierResultOutput = {
  chantier: { id: string; nom: string };
  indicateurs: {
    id: string;
    nom: string;
    periodicite: string | null;
    delai_disponibilite_mois: number | null;
    mailles: MailleOutput[];
  }[];
};

export type GetIndicateursNonAJourOutput = {
  resultats: ChantierResultOutput[];
  indicateurs_non_suivis?: string[];
  acces_refuse?: boolean;
  _output_instructions: string;
};

function toOutput(
  chantiers: RecupererIndicateursNonAJourResult["chantiers"],
  isDetailed: boolean,
): ChantierResultOutput[] {
  return chantiers.map(({ chantier, indicateurs }) => ({
    chantier,
    indicateurs: indicateurs.map((indicateur) => ({
      id: indicateur.id,
      nom: indicateur.nom,
      periodicite: indicateur.periodicite,
      delai_disponibilite_mois: indicateur.delaiDisponibiliteMois,
      mailles: indicateur.mailles.map((maille) => ({
        maille: maille.maille,
        nb_territoires_en_retard: maille.territoiresEnRetard.length,
        nb_territoires_applicables: maille.nbTerritoiresApplicables,
        ...(isDetailed
          ? {
              territoires_en_retard: maille.territoiresEnRetard.map(
                (territoire) => ({
                  code: territoire.code,
                  nom: territoire.nom,
                  date_derniere_valeur: territoire.dateDerniereValeur,
                  mise_a_jour_attendue_depuis:
                    territoire.miseAJourAttendueDepuis,
                }),
              ),
            }
          : {}),
      })),
    })),
  }));
}

function buildOutputInstructions({
  isDetailed,
  indicateursNonSuivis,
  inaccessibleChantierIds,
}: {
  isDetailed: boolean;
  indicateursNonSuivis: string[];
  inaccessibleChantierIds: string[];
}): string {
  const instructions = [
    'Présente chaque chantier au format "CH-XXX — Nom du chantier" et chaque indicateur au format "IND-XXX — Nom de l\'indicateur".',
    "Si la question porte sur les chantiers (« sur quels chantiers… »), liste les chantiers avec leur nombre d'indicateurs non à jour, sans détailler les indicateurs, puis propose le détail d'un chantier.",
    "Sinon, regroupe par chantier puis par indicateur, avec une ligne par maille au format « Départements : 12 / 101 territoires en retard » (« Régions » pour REG, « National » pour NAT).",
    "Si l'utilisateur demande pourquoi une donnée n'est pas à jour, explique que la date théorique de mise à jour (date de la dernière valeur + periodicite + delai_disponibilite_mois déclarés pour l'indicateur) est dépassée.",
  ];

  if (isDetailed) {
    instructions.push(
      "Liste les territoires en retard avec la date à laquelle la mise à jour était attendue (mise_a_jour_attendue_depuis). Un territoire dont date_derniere_valeur est null n'a jamais eu de valeur renseignée : présente-le comme « aucune valeur renseignée ». Si mise_a_jour_attendue_depuis est null alors que date_derniere_valeur est renseignée, la périodicité ou le délai de mise à jour de l'indicateur n'est pas déclaré : dis-le au lieu d'afficher une date.",
    );
  } else {
    instructions.push(
      "Le détail par territoire n'est pas inclus. Propose à l'utilisateur de cibler un indicateur ou un territoire pour obtenir la liste des territoires en retard. Ne classe pas les territoires entre eux : cette information n'est pas disponible.",
    );
  }

  if (indicateursNonSuivis.length > 0) {
    instructions.push(
      `Ces indicateurs ne sont pas suivis, ou pas accessibles, sur le périmètre interrogé : ${indicateursNonSuivis.join(", ")}. Dis-le explicitement, ne les présente jamais comme à jour.`,
    );
  }

  if (inaccessibleChantierIds.length > 0) {
    instructions.push(
      `Ces chantiers demandés ne sont pas accessibles à l'utilisateur : ${inaccessibleChantierIds.join(", ")}. Dis-le sans rien affirmer d'autre à leur sujet, et ne les présente jamais comme à jour.`,
    );
  }

  instructions.push(
    "Si resultats est vide (hors indicateurs non suivis et chantiers non accessibles), dis explicitement que toutes les données du périmètre interrogé sont à jour.",
  );

  return instructions.join("\n\n");
}

export function createGetIndicateursNonAJourTool({
  recupererIndicateursNonAJourQuery,
}: {
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
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

        const requestedChantierIds =
          input.chantier_ids && input.chantier_ids.length > 0
            ? input.chantier_ids
            : undefined;

        const chantierIds = requestedChantierIds
          ? requestedChantierIds.filter((chantierId) =>
              chantiersAccessibles.includes(chantierId),
            )
          : chantiersAccessibles;

        if (!input.territoire_code && territoiresAccessibles.length === 0) {
          return {
            resultats: [],
            _output_instructions:
              "L'utilisateur n'a accès à aucun territoire : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        if (chantierIds.length === 0) {
          return {
            resultats: [],
            _output_instructions: requestedChantierIds
              ? "Aucun des chantiers demandés n'est accessible pour cet utilisateur."
              : "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        const indicateurIds =
          input.indicateur_ids && input.indicateur_ids.length > 0
            ? input.indicateur_ids
            : undefined;

        const isDetailed = Boolean(indicateurIds || input.territoire_code);

        const result = await recupererIndicateursNonAJourQuery.execute({
          chantierIds,
          territoireCodes: input.territoire_code
            ? [input.territoire_code]
            : territoiresAccessibles,
          indicateurIds,
        });

        const indicateursNonSuivis = (indicateurIds ?? []).filter(
          (indicateurId) =>
            !result.indicateursApplicablesIds.includes(indicateurId),
        );

        const inaccessibleChantierIds = (requestedChantierIds ?? []).filter(
          (chantierId) => !chantiersAccessibles.includes(chantierId),
        );

        return {
          resultats: toOutput(result.chantiers, isDetailed),
          ...(indicateursNonSuivis.length > 0
            ? { indicateurs_non_suivis: indicateursNonSuivis }
            : {}),
          _output_instructions: buildOutputInstructions({
            isDetailed,
            indicateursNonSuivis,
            inaccessibleChantierIds,
          }),
        };
      },
    });
  };
}
