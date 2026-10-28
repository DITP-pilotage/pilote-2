import { tool } from "ai";
import { z } from "zod";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import {
  GetHistoriqueIndicateurTerritoireQuery,
  type GroupeHistoriqueIndicateur,
} from "@/server/chantiers/query/GetHistoriqueIndicateurTerritoireQuery";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { PROPOSITION_TYPES_EVENEMENT } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { expliquerConstructionValeurAffichee } from "@/server/albert/tools/expliquerConstructionValeurAffichee";

const SEUIL_BESOIN_PRECISION = 100;

export const getHistoriqueIndicateurInputSchema = z.object({
  indicateur_id: z
    .string()
    .describe("Identifiant canonique de l'indicateur (ex: IND-894)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  date_debut: z.iso
    .date()
    .optional()
    .describe("Date de début de la période demandée (ISO, ex: 2024-01-01)"),
  date_fin: z.iso
    .date()
    .optional()
    .describe("Date de fin de la période demandée (ISO, ex: 2024-12-31)"),
  type_filtre: z
    .enum(["TOUS", "PROPOSITIONS"])
    .optional()
    .default("TOUS")
    .describe(
      "Mets 'PROPOSITIONS' quand la question porte spécifiquement sur les propositions de valeur d'avancement (PVA) — création, modification, accusé de réception, acceptation, refus. Sinon laisse 'TOUS'.",
    ),
});

export type GetHistoriqueIndicateurOutput = {
  indicateur: { id: string; nom: string; unite_mesure: string | null } | null;
  territoire_code?: string;
  agrege_bloque?: true;
  besoin_precision?: {
    nombre_evenements: number;
    date_evenement_la_plus_ancienne?: string;
    date_evenement_la_plus_recente?: string;
  };
  construction_valeur_affichee?: string;
  groupes?: GroupeHistoriqueIndicateur[];
  introuvable?: true;
};

export function createGetHistoriqueIndicateurTool({
  getIndicateurContexteQuery,
  getHistoriqueIndicateurTerritoireQuery,
}: {
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
  getHistoriqueIndicateurTerritoireQuery: GetHistoriqueIndicateurTerritoireQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie l'historique des actions sur la valeur d'un indicateur pour un territoire (import, modification, proposition, acceptation, refus…), groupées par mois de valeur, dans l'ordre chronologique.
- \`date_valeur\` : le mois auquel s'applique la valeur ; \`date_creation\` : le moment où l'action a eu lieu.
- \`categorie\` : IMPORT (import direct par la direction de projet) ou PROPOSITION (étape d'une proposition du territoire).
- Les valeurs citées sont les valeurs importées : la valeur affichée dans PILOTE peut en différer (\`construction_valeur_affichee\` explique comment). Ne les compare pas telles quelles aux valeurs d'une évolution.
- \`introuvable\` : aucun indicateur ne porte cet identifiant.
- \`agrege_bloque\` : à cette maille, les valeurs sont agrégées depuis la maille inférieure ; il n'y a pas d'historique à cette maille.
- \`besoin_precision\` : trop d'événements pour les présenter d'un coup. Propose une période entre les bornes fournies, puis rappelle l'outil avec \`date_debut\` et \`date_fin\` au format ISO.
Utilise-le pour : l'historique d'un indicateur, « qui a modifié cette valeur ? », une question sur les propositions de valeur d'avancement (PVA) : mets alors \`type_filtre\` à "PROPOSITIONS".
Ne l'utilise pas pour : la courbe ou la tendance de la valeur → get_evolution_indicateur.`,
      inputSchema: getHistoriqueIndicateurInputSchema,
      execute: async (input): Promise<GetHistoriqueIndicateurOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const contexte = await getIndicateurContexteQuery.execute({
          indicateurId: input.indicateur_id,
        });

        if (!contexte) {
          return {
            indicateur: null,
            introuvable: true,
          };
        }

        if (!chantiersAccessibles.includes(contexte.chantier.id)) {
          throw new Error(
            `Accès non autorisé au chantier ${contexte.chantier.id}`,
          );
        }

        const indicateurResume = {
          id: contexte.id,
          nom: contexte.nom,
          unite_mesure: contexte.uniteMesure,
        };

        const { maille } = territoireCodeVersMailleCodeInsee(
          input.territoire_code,
        );

        const estAgregeBloque =
          (maille === "NAT" && contexte.mailleNatAgregee) ||
          (maille === "REG" && contexte.mailleRegAgregee);

        if (estAgregeBloque) {
          return {
            indicateur: indicateurResume,
            territoire_code: input.territoire_code,
            agrege_bloque: true,
          };
        }

        const filtres = {
          indicId: input.indicateur_id,
          territoireCode: input.territoire_code,
          dateDebut: input.date_debut ? new Date(input.date_debut) : undefined,
          dateFin: input.date_fin ? new Date(input.date_fin) : undefined,
          typesEvenement:
            input.type_filtre === "PROPOSITIONS"
              ? PROPOSITION_TYPES_EVENEMENT
              : undefined,
        };

        const resultat =
          await getHistoriqueIndicateurTerritoireQuery.execute(filtres);

        if (resultat.nombreEvenements > SEUIL_BESOIN_PRECISION) {
          return {
            indicateur: indicateurResume,
            territoire_code: input.territoire_code,
            besoin_precision: {
              nombre_evenements: resultat.nombreEvenements,
              date_evenement_la_plus_ancienne: resultat.dateMin ?? undefined,
              date_evenement_la_plus_recente: resultat.dateMax ?? undefined,
            },
          };
        }

        const explicationValeurAffichee = expliquerConstructionValeurAffichee(
          contexte.parametrageValeurAffichee,
        );
        return {
          indicateur: indicateurResume,
          territoire_code: input.territoire_code,
          ...(explicationValeurAffichee && {
            construction_valeur_affichee: explicationValeurAffichee,
          }),
          groupes: resultat.groupes,
        };
      },
    });
  };
}
