import { tool } from "ai";
import { z } from "zod";
import type {
  ChantierIndicateursNonAJour,
  RecupererIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";
import type { VerifierIndicateursDemandesQuery } from "@/server/chantiers/infrastructure/queries/VerifierIndicateursDemandesQuery";

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

type IndicateursExclus = {
  indicateurs_introuvables?: string[];
  indicateurs_hors_chantiers_demandes?: {
    indicateur_id: string;
    chantier_id: string;
  }[];
  indicateurs_non_applicables?: string[];
};

export type GetIndicateursNonAJourOutput = IndicateursExclus & {
  resultats: ChantierIndicateursNonAJour[];
  acces_refuse?: boolean;
  _output_instructions: string;
};

function nonEmpty(ids: string[] | undefined): string[] | undefined {
  return ids && ids.length > 0 ? ids : undefined;
}

async function verifierIndicateursDemandes({
  verifierIndicateursDemandesQuery,
  indicateurIds,
  territoireCodes,
  chantierIds,
  chantiersAccessibles,
}: {
  verifierIndicateursDemandesQuery: VerifierIndicateursDemandesQuery;
  indicateurIds: string[];
  territoireCodes: string[];
  chantierIds: string[];
  chantiersAccessibles: string[];
}): Promise<{ retenus: string[]; exclus: IndicateursExclus }> {
  const indicateurs = new Map(
    (
      await verifierIndicateursDemandesQuery.execute({
        indicateurIds,
        territoireCodes,
      })
    ).map((indicateur) => [indicateur.id, indicateur]),
  );

  const retenus: string[] = [];
  const introuvables: string[] = [];
  const horsChantiersDemandes: {
    indicateur_id: string;
    chantier_id: string;
  }[] = [];
  const nonApplicables: string[] = [];

  for (const indicateurId of indicateurIds) {
    const indicateur = indicateurs.get(indicateurId);
    if (!indicateur || !chantiersAccessibles.includes(indicateur.chantierId)) {
      introuvables.push(indicateurId);
    } else if (!chantierIds.includes(indicateur.chantierId)) {
      horsChantiersDemandes.push({
        indicateur_id: indicateurId,
        chantier_id: indicateur.chantierId,
      });
    } else if (!indicateur.estApplicable) {
      nonApplicables.push(indicateurId);
    } else {
      retenus.push(indicateurId);
    }
  }

  const exclus: IndicateursExclus = {};
  if (introuvables.length > 0) exclus.indicateurs_introuvables = introuvables;
  if (horsChantiersDemandes.length > 0)
    exclus.indicateurs_hors_chantiers_demandes = horsChantiersDemandes;
  if (nonApplicables.length > 0)
    exclus.indicateurs_non_applicables = nonApplicables;

  return { retenus, exclus };
}

function buildExclusionInstructions(
  exclus: IndicateursExclus,
  inaccessibleChantierIds: string[],
): string[] {
  const instructions: string[] = [];

  if (exclus.indicateurs_introuvables) {
    instructions.push(
      `Ces indicateurs sont introuvables ou ne sont pas accessibles à l'utilisateur : ${exclus.indicateurs_introuvables.join(", ")}. Dis-le sans rien affirmer d'autre à leur sujet.`,
    );
  }

  if (exclus.indicateurs_hors_chantiers_demandes) {
    const indicateurs = exclus.indicateurs_hors_chantiers_demandes.map(
      ({ indicateur_id, chantier_id }) => `${indicateur_id} (${chantier_id})`,
    );
    instructions.push(
      `Ces indicateurs n'appartiennent pas aux chantiers demandés : ${indicateurs.join(", ")}. Dis-le et propose d'interroger leur chantier de rattachement, indiqué entre parenthèses.`,
    );
  }

  if (exclus.indicateurs_non_applicables) {
    instructions.push(
      `Ces indicateurs ne sont applicables sur aucun territoire du périmètre interrogé : ${exclus.indicateurs_non_applicables.join(", ")}. Dis-le et propose d'interroger un autre territoire ou le national.`,
    );
  }

  if (inaccessibleChantierIds.length > 0) {
    instructions.push(
      `Ces chantiers demandés ne sont pas accessibles à l'utilisateur : ${inaccessibleChantierIds.join(", ")}. Dis-le sans rien affirmer d'autre à leur sujet.`,
    );
  }

  if (instructions.length > 0) {
    instructions.push(
      "Ne présente jamais ces indicateurs ou ces chantiers comme à jour.",
    );
  }

  return instructions;
}

function buildOutputInstructions(
  isDetailed: boolean,
  exclusionInstructions: string[],
): string {
  return [
    'Présente chaque chantier au format "CH-XXX — Nom du chantier" et chaque indicateur au format "IND-XXX — Nom de l\'indicateur".',
    "Si la question porte sur les chantiers (« sur quels chantiers… »), liste les chantiers avec leur nombre d'indicateurs non à jour, sans détailler les indicateurs, puis propose le détail d'un chantier.",
    "Sinon, regroupe par chantier puis par indicateur, avec une ligne par maille au format « Départements : 12 / 101 territoires en retard » (« Régions » pour REG, « National » pour NAT).",
    "Si l'utilisateur demande pourquoi une donnée n'est pas à jour, explique que la date théorique de mise à jour (date de la dernière valeur + periodicite + delaiDisponibiliteMois déclarés pour l'indicateur) est dépassée.",
    isDetailed
      ? "Liste les territoires en retard avec la date à laquelle la mise à jour était attendue (miseAJourAttendueDepuis). Un territoire dont dateDerniereValeur est null n'a jamais eu de valeur renseignée : présente-le comme « aucune valeur renseignée ». Si miseAJourAttendueDepuis est null alors que dateDerniereValeur est renseignée, la périodicité ou le délai de mise à jour de l'indicateur n'est pas déclaré : dis-le au lieu d'afficher une date."
      : "Le détail par territoire n'est pas inclus. Propose à l'utilisateur de cibler un indicateur ou un territoire pour obtenir la liste des territoires en retard. Ne classe pas les territoires entre eux : cette information n'est pas disponible.",
    ...exclusionInstructions,
    "Si resultats est vide, dis explicitement que toutes les données interrogées sont à jour, hors indicateurs et chantiers signalés ci-dessus.",
  ].join("\n\n");
}

export function createGetIndicateursNonAJourTool({
  recupererIndicateursNonAJourQuery,
  verifierIndicateursDemandesQuery,
}: {
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
  verifierIndicateursDemandesQuery: VerifierIndicateursDemandesQuery;
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
        const chantierIds =
          requestedChantierIds?.filter((chantierId) =>
            chantiersAccessibles.includes(chantierId),
          ) ?? chantiersAccessibles;

        if (chantierIds.length === 0) {
          return {
            resultats: [],
            _output_instructions: requestedChantierIds
              ? "Aucun des chantiers demandés n'est accessible pour cet utilisateur."
              : "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        const inaccessibleChantierIds = (requestedChantierIds ?? []).filter(
          (chantierId) => !chantiersAccessibles.includes(chantierId),
        );
        const territoireCodes = input.territoire_code
          ? [input.territoire_code]
          : territoiresAccessibles;
        const requestedIndicateurIds = nonEmpty(input.indicateur_ids);

        const { retenus, exclus } = requestedIndicateurIds
          ? await verifierIndicateursDemandes({
              verifierIndicateursDemandesQuery,
              indicateurIds: requestedIndicateurIds,
              territoireCodes,
              chantierIds,
              chantiersAccessibles,
            })
          : { retenus: undefined, exclus: {} };

        const exclusionInstructions = buildExclusionInstructions(
          exclus,
          inaccessibleChantierIds,
        );

        if (retenus?.length === 0) {
          return {
            resultats: [],
            ...exclus,
            _output_instructions: exclusionInstructions.join("\n\n"),
          };
        }

        const isDetailed = Boolean(
          requestedIndicateurIds || input.territoire_code,
        );
        const chantiers = await recupererIndicateursNonAJourQuery.execute({
          chantierIds,
          territoireCodes,
          indicateurIds: retenus,
          avecDetailTerritoires: isDetailed,
        });

        return {
          resultats: chantiers,
          ...exclus,
          _output_instructions: buildOutputInstructions(
            isDetailed,
            exclusionInstructions,
          ),
        };
      },
    });
  };
}
