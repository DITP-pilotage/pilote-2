import { tool } from "ai";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import type {
  GetChantiersSignalesDetailQuery,
  ChantierSignale,
} from "@/server/chantiers/infrastructure/queries/GetChantiersSignalesDetailQuery";
import {
  TYPES_ALERTE_CHANTIER,
  type TypeAlerteChantier,
} from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";

const TYPES_ALERTE_PAR_MAILLE: Record<$Enums.Maille, TypeAlerteChantier[]> = {
  NAT: [
    "estEnAlerteTauxAvancementNonCalculé",
    "estEnAlerteAbscenceTauxAvancementDepartemental",
    "estEnAlerteMétéoNonRenseignée",
    "estEnAlertePossedePropositionsValeurAvancement",
  ],
  REG: [
    "estEnAlerteÉcart",
    "estEnAlerteBaisse",
    "estEnAlerteMétéoNonRenseignée",
    "estEnAlertePossedePropositionsValeurAvancement",
  ],
  DEPT: [
    "estEnAlerteÉcart",
    "estEnAlerteBaisse",
    "estEnAlerteMétéoNonRenseignée",
    "estEnAlertePossedePropositionsValeurAvancement",
  ],
};

export const getChantiersSignalesInputSchema = z.object({
  territoire_code: z
    .string()
    .describe(
      "Code du territoire (ex: NAT-FR, REG-11, DEPT-75). Un seul territoire par appel, pas de sous-territoires.",
    ),
  categories: z
    .array(z.enum(TYPES_ALERTE_CHANTIER))
    .optional()
    .describe(
      "Catégories de signalement demandées. Absent = toutes les catégories applicables à la maille du territoire interrogé.",
    ),
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-001', 'CH-042']). Si fourni, restreint la recherche à ces chantiers.",
    ),
});

type GetChantiersSignalesInput = z.infer<
  typeof getChantiersSignalesInputSchema
>;

export type GetChantiersSignalesOutput = {
  resultats: ChantierSignale[];
  acces_refuse?: boolean;
  categories_non_applicables: TypeAlerteChantier[];
  _output_instructions: string;
};

function buildOutputInstructions(
  typesAlerteNonApplicables: TypeAlerteChantier[],
): string {
  const base =
    "Utilise toujours les libellés officiels des catégories de signalement (jamais les codes internes), " +
    'et présente chaque chantier au format "CH-XXX — Nom du chantier".\n\n' +
    "Présente par défaut par catégorie (une section par catégorie avec la liste des chantiers concernés). " +
    "Bascule vers une présentation par chantier (un chantier avec la liste de ses catégories) uniquement si la demande porte sur un chantier précis (ex: « quels sont les signalements du chantier CH-042 ? »).\n\n" +
    "Un chantier concerné par plusieurs catégories ne doit JAMAIS être présenté comme deux chantiers distincts dans des sections séparées sans qu'un lien explicite soit fait entre les deux occurrences.\n\n" +
    'Les champs "ecart" et "meteo" sont présents sur chaque chantier mais ne doivent être mentionnés que s\'ils sont pertinents pour au moins une des catégories matchées par ce chantier ("ecart" pour la catégorie "Retard par rapport à la médiane", "meteo" pour "Météo et synthèse non renseignées").';

  if (typesAlerteNonApplicables.length === 0) return base;

  return (
    `${base}\n\n` +
    "Certaines catégories demandées ne sont pas applicables au territoire interrogé. " +
    "Mentionne-le explicitement à l'utilisateur en reprenant ces raisons, sans jamais présenter cela comme une absence de résultats silencieuse."
  );
}

export function createGetChantiersSignalesTool({
  getChantiersSignalesDetailQuery,
}: {
  getChantiersSignalesDetailQuery: GetChantiersSignalesDetailQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Outil pour obtenir la liste des chantiers signalés (chantiers avec une alerte) sur un territoire donné, catégorie par catégorie.

Catégories disponibles :
- "estEnAlerteÉcart" : Retard par rapport à la médiane
- "estEnAlerteBaisse" : Tendance en baisse
- "estEnAlerteTauxAvancementNonCalculé" : Taux d'avancement non calculé
- "estEnAlerteAbscenceTauxAvancementDepartemental" : Absence de taux d'avancement départemental
- "estEnAlerteMétéoNonRenseignée" : Météo et synthèse non renseignées
- "estEnAlertePossedePropositionsValeurAvancement" : Proposition de valeur d'avancement

Catégories applicables selon la maille du territoire :
- National (NAT-FR) : estEnAlerteTauxAvancementNonCalculé, estEnAlerteAbscenceTauxAvancementDepartemental, estEnAlerteMétéoNonRenseignée, estEnAlertePossedePropositionsValeurAvancement
- Régional/départemental (REG-XX, DEPT-XX) : estEnAlerteÉcart, estEnAlerteBaisse, estEnAlerteMétéoNonRenseignée, estEnAlertePossedePropositionsValeurAvancement

⚠️ N'utilise PAS cet outil si la demande porte sur UNE SEULE catégorie qui a un équivalent exact dans get_chantiers :
- "estEnAlerteÉcart" seul → get_chantiers(view='en_retard')
- "estEnAlerteBaisse" seul → get_chantiers(tendance='BAISSE')

Utilise get_chantiers_signales dans tous les autres cas : une seule catégorie sans équivalent dans get_chantiers, plusieurs catégories demandées ensemble (y compris si estEnAlerteÉcart et/ou estEnAlerteBaisse en font partie), ou aucune catégorie précisée ("chantiers signalés", "signalements" sans détail → toutes les catégories applicables à la maille).

Un seul territoire par appel, pas de sous-territoires.`,
      inputSchema: getChantiersSignalesInputSchema,
      execute: async (
        input: GetChantiersSignalesInput,
      ): Promise<GetChantiersSignalesOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          return {
            resultats: [],
            categories_non_applicables: [],
            acces_refuse: true,
            _output_instructions:
              "L'utilisateur n'a pas accès à ce territoire pour les chantiers signalés. Explique-le poliment sans donner de détail sur les données du territoire.",
          };
        }

        const chantierIdsFiltrants =
          input.chantier_ids && input.chantier_ids.length > 0
            ? input.chantier_ids
            : undefined;

        const filteredChantierIds = chantierIdsFiltrants?.filter((id) =>
          chantiersAccessibles.includes(id),
        );

        if (filteredChantierIds && filteredChantierIds.length === 0) {
          return {
            resultats: [],
            categories_non_applicables: [],
            _output_instructions:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
        }

        const { maille } = territoireCodeVersMailleCodeInsee(
          input.territoire_code,
        );
        const typesAlerteApplicables = TYPES_ALERTE_PAR_MAILLE[maille] ?? [];
        const typesAlerteDemandes = input.categories ?? typesAlerteApplicables;

        const typesAlerteAInterroger = typesAlerteDemandes.filter(
          (typeAlerte) => typesAlerteApplicables.includes(typeAlerte),
        );
        const typesAlerteNonApplicables = typesAlerteDemandes.filter(
          (typeAlerte) => !typesAlerteApplicables.includes(typeAlerte),
        );

        const jalonEnCours = getAnneeDateDeBascule(
          new Date(),
          configuration().dateBasculeAffichageValeursAnneePrecedente,
        );

        const resultats =
          typesAlerteAInterroger.length === 0
            ? []
            : await getChantiersSignalesDetailQuery.execute({
                territoireCode: input.territoire_code,
                jalon: jalonEnCours,
                chantierIds: filteredChantierIds ?? chantiersAccessibles,
                typesAlerte: typesAlerteAInterroger,
              });

        return {
          resultats,
          categories_non_applicables: typesAlerteNonApplicables,
          _output_instructions: buildOutputInstructions(
            typesAlerteNonApplicables,
          ),
        };
      },
    });
  };
}
