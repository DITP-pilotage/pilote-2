import { tool } from "ai";
import { z } from "zod";
import type {
  GetChantiersSignalesDetailQuery,
  ChantierSignale,
} from "@/server/chantiers/infrastructure/queries/GetChantiersSignalesDetailQuery";
import type { CategorieAlerteChantier } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

const CATEGORIES: CategorieAlerteChantier[] = [
  "ecart",
  "baisse",
  "taux_non_calcule",
  "absence_taux_departemental",
  "meteo_non_renseignee",
  "pva",
];

const LIBELLES_CATEGORIES: Record<CategorieAlerteChantier, string> = {
  ecart: "Retard par rapport à la médiane",
  baisse: "Tendance en baisse",
  taux_non_calcule: "Taux d'avancement non calculé",
  absence_taux_departemental: "Absence de taux d'avancement départemental",
  meteo_non_renseignee: "Météo et synthèse non renseignées",
  pva: "Proposition de valeur d'avancement",
};

const CATEGORIES_PAR_MAILLE: Record<
  "NAT" | "REG" | "DEPT",
  CategorieAlerteChantier[]
> = {
  NAT: [
    "taux_non_calcule",
    "absence_taux_departemental",
    "meteo_non_renseignee",
    "pva",
  ],
  REG: ["ecart", "baisse", "meteo_non_renseignee", "pva"],
  DEPT: ["ecart", "baisse", "meteo_non_renseignee", "pva"],
};

const RAISONS_NON_APPLICABLE: Partial<Record<CategorieAlerteChantier, string>> = {
  ecart:
    "Le signalement « Retard par rapport à la médiane » ne peut pas être calculé au niveau national : il repose sur une comparaison entre le taux d'avancement d'un chantier sur un territoire donné et la médiane des autres territoires du même niveau.",
  baisse:
    "Le signalement « Tendance en baisse » ne peut pas être calculé au niveau national : il repose sur la tendance d'évolution du taux d'avancement d'un chantier sur un territoire régional ou départemental.",
  taux_non_calcule:
    "Le signalement « Taux d'avancement non calculé » n'est pertinent qu'au niveau national : il identifie les chantiers dont le taux d'avancement national attendu n'a pas encore été calculé.",
  absence_taux_departemental:
    "Le signalement « Absence de taux d'avancement départemental » n'est pertinent qu'au niveau national : il identifie, pour chaque chantier national, l'absence de taux d'avancement départemental agrégé.",
};

export const getChantiersSignalesInputSchema = z.object({
  territoire_code: z
    .string()
    .describe(
      "Code du territoire (ex: NAT-FR, REG-11, DEPT-75). Un seul territoire par appel, pas de sous-territoires.",
    ),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  categories: z
    .array(z.enum(CATEGORIES as [CategorieAlerteChantier, ...CategorieAlerteChantier[]]))
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

type GetChantiersSignalesInput = z.infer<typeof getChantiersSignalesInputSchema>;

export type GetChantiersSignalesOutput = {
  resultats: ChantierSignale[];
  acces_refuse?: boolean;
  categories_non_applicables?: { categorie: CategorieAlerteChantier; raison: string }[];
  _output_instructions: string;
};

function buildOutputInstructions(
  categoriesNonApplicables: CategorieAlerteChantier[],
): string {
  const base =
    "Utilise toujours les libellés officiels des catégories de signalement (jamais les codes internes), " +
    'et présente chaque chantier au format "CH-XXX — Nom du chantier".\n\n' +
    "Choisis la présentation la plus adaptée à la demande de l'utilisateur :\n" +
    "- par catégorie (une section par catégorie avec la liste des chantiers concernés) si la demande porte sur une catégorie précise (ex: « quels chantiers ont un problème de météo ? ») ;\n" +
    "- par chantier (un chantier avec la liste de ses catégories) si la demande porte sur un chantier précis (ex: « quels sont les signalements du chantier CH-042 ? ») ou sur plusieurs catégories à la fois.\n\n" +
    "Un chantier concerné par plusieurs catégories ne doit JAMAIS être présenté comme deux chantiers distincts dans des sections séparées sans qu'un lien explicite soit fait entre les deux occurrences.\n\n" +
    'Les champs "ecart" et "meteo" sont présents sur chaque chantier mais ne doivent être mentionnés que s\'ils sont pertinents pour au moins une des catégories matchées par ce chantier ("ecart" pour la catégorie "Retard par rapport à la médiane", "meteo" pour "Météo et synthèse non renseignées").';

  if (categoriesNonApplicables.length === 0) return base;

  const raisons = categoriesNonApplicables
    .map(
      (categorie) =>
        `- ${LIBELLES_CATEGORIES[categorie]} : ${RAISONS_NON_APPLICABLE[categorie]}`,
    )
    .join("\n");

  return (
    `${base}\n\n` +
    "Certaines catégories demandées ne sont pas applicables au territoire interrogé. " +
    "Mentionne-le explicitement à l'utilisateur en reprenant ces raisons, sans jamais présenter cela comme une absence de résultats silencieuse :\n" +
    raisons
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
- "ecart" : Retard par rapport à la médiane
- "baisse" : Tendance en baisse
- "taux_non_calcule" : Taux d'avancement non calculé
- "absence_taux_departemental" : Absence de taux d'avancement départemental
- "meteo_non_renseignee" : Météo et synthèse non renseignées
- "pva" : Proposition de valeur d'avancement

Catégories applicables selon la maille du territoire :
- National (NAT-FR) : taux_non_calcule, absence_taux_departemental, meteo_non_renseignee, pva
- Régional/départemental (REG-XX, DEPT-XX) : ecart, baisse, meteo_non_renseignee, pva

⚠️ N'utilise PAS cet outil si la demande porte sur UNE SEULE catégorie qui a un équivalent exact dans get_chantiers :
- "ecart" seul → get_chantiers(view='en_retard')
- "baisse" seul → get_chantiers(tendance='BAISSE')

Utilise get_chantiers_signales dans tous les autres cas : une seule catégorie sans équivalent dans get_chantiers, plusieurs catégories demandées ensemble (y compris si ecart et/ou baisse en font partie), ou aucune catégorie précisée ("chantiers signalés", "signalements" sans détail → toutes les catégories applicables à la maille).

Un seul territoire par appel, pas de sous-territoires.`,
      inputSchema: getChantiersSignalesInputSchema,
      execute: async (input: GetChantiersSignalesInput): Promise<GetChantiersSignalesOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          return {
            resultats: [],
            acces_refuse: true,
            _output_instructions:
              "L'utilisateur n'a pas accès à ce territoire pour les chantiers signalés. Explique-le poliment sans donner de détail sur les données du territoire.",
          };
        }

        const filteredChantierIds = input.chantier_ids?.filter((id) =>
          chantiersAccessibles.includes(id),
        );

        if (
          filteredChantierIds &&
          filteredChantierIds.length === 0 &&
          input.chantier_ids &&
          input.chantier_ids.length > 0
        ) {
          return {
            resultats: [],
            _output_instructions:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
        }

        const { maille } = territoireCodeVersMailleCodeInsee(
          input.territoire_code,
        );
        const categoriesApplicables =
          CATEGORIES_PAR_MAILLE[maille as "NAT" | "REG" | "DEPT"] ?? [];
        const categoriesDemandees = input.categories ?? categoriesApplicables;

        const categoriesAInterroger = categoriesDemandees.filter((categorie) =>
          categoriesApplicables.includes(categorie),
        );
        const categoriesNonApplicables = categoriesDemandees.filter(
          (categorie) => !categoriesApplicables.includes(categorie),
        );

        const resultats =
          categoriesAInterroger.length === 0
            ? []
            : await getChantiersSignalesDetailQuery.execute({
                territoireCode: input.territoire_code,
                jalon: input.jalon,
                chantierIds: filteredChantierIds ?? chantiersAccessibles,
                categories: categoriesAInterroger,
              });

        return {
          resultats,
          ...(categoriesNonApplicables.length > 0
            ? {
                categories_non_applicables: categoriesNonApplicables.map(
                  (categorie) => ({
                    categorie,
                    raison: RAISONS_NON_APPLICABLE[categorie] ?? "",
                  }),
                ),
              }
            : {}),
          _output_instructions: buildOutputInstructions(categoriesNonApplicables),
        };
      },
    });
  };
}
