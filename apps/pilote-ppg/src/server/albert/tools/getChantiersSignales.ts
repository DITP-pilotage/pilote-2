import { tool } from "ai";
import { z } from "zod";
import { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { GetChantiersSignalesListResult } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  CATEGORIES_SIGNALEMENT,
  categoriesApplicables,
  nomCategorie,
  type CategorieSignalement,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";
import { LIBELLE_TENDANCE_BAISSE } from "@/server/chantiers/app/contrats/LibellesAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export const getChantiersSignalesInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Mets `true` quand la demande couvre un territoire ET ses sous-territoires. " +
        "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
        "plutôt que d'énumérer chaque sous-territoire avec des appels séparés.",
    ),
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-001', 'CH-042']). Si fourni, restreint la recherche à ces chantiers.",
    ),
  categorie_signalement: z
    .enum(CATEGORIES_SIGNALEMENT)
    .optional()
    .describe(
      "Restreint aux chantiers ayant cette catégorie de signalement précise : " +
        CATEGORIES_SIGNALEMENT.map(
          (categorie) => `${categorie} (${nomCategorie(categorie)})`,
        ).join(", ") +
        ". Omis : retourne tous les chantiers signalés, toutes catégories applicables à la maille confondues, avec leurs catégories regroupées.",
    ),
});

type GetChantiersSignalesInput = z.infer<
  typeof getChantiersSignalesInputSchema
>;

type ResultatTerritoire =
  | GetChantiersSignalesListResult
  | {
      territoire_code: string;
      chantiers: [];
      non_applicable: { raison: string };
    };

export type GetChantiersSignalesOutput = {
  resultats: ResultatTerritoire[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue les catégories de signalement telles quelles (elles sont déjà rédigées en langage utilisateur, ne les reformule pas). Un chantier peut cumuler plusieurs catégories : présente-les regroupées pour ce chantier, sans le dupliquer. "Signalé" est une notion distincte de "en retard" et "en difficulté" (qui existent dans l'outil get_chantiers) : ne les confonds pas. Les règles de signalement diffèrent entre le niveau national et les niveaux régional/départemental.`;

function raisonNonApplicable(
  categorie: CategorieSignalement,
  maille: string,
): string {
  const nom = nomCategorie(categorie);
  if (maille === "NAT") {
    return `La catégorie "${nom}" ne s'applique qu'aux mailles régionale et départementale, pas au niveau national.`;
  }
  return `La catégorie "${nom}" ne s'applique qu'au niveau national, pas à la maille régionale ou départementale.`;
}

function estNonApplicable(resultat: ResultatTerritoire): resultat is {
  territoire_code: string;
  chantiers: [];
  non_applicable: { raison: string };
} {
  return "non_applicable" in resultat;
}

function getOutputInstructions(
  resultats: ResultatTerritoire[],
  territoiresAccessibles: string[],
): string {
  const codesRestreints = resultats
    .filter((resultat) => !estNonApplicable(resultat))
    .map((resultat) => resultat.territoire_code)
    .filter((code) => !territoiresAccessibles.includes(code));

  let instructions = OUTPUT_INSTRUCTIONS;

  if (codesRestreints.length > 0) {
    instructions =
      `⚠️ Restriction d'accès — territoires ${codesRestreints.join(", ")} : la catégorie "tendance en baisse" n'est pas disponible pour ces territoires (le champ tendance est retourné à null). Un chantier dont c'était l'unique catégorie de signalement n'apparaît alors plus du tout dans la liste retournée. Ne présente donc pas cette liste comme exhaustive pour ces territoires, et mentionne cette restriction explicitement dans ta réponse.\n\n` +
      instructions;
  }

  if (resultats.some(estNonApplicable)) {
    instructions =
      "L'analyse demandée n'est pas applicable pour au moins un des territoires interrogés. Explique-le clairement à l'utilisateur en reprenant fidèlement la raison fournie dans non_applicable.raison pour ce territoire. Ne présente pas de liste vide ni ne conclus qu'aucun chantier n'est signalé pour ce territoire.\n\n" +
      instructions;
  }

  return instructions;
}

function masquerCategoriesNonAccessibles(
  resultat: GetChantiersSignalesListResult,
  territoiresAccessibles: string[],
): GetChantiersSignalesListResult {
  if (territoiresAccessibles.includes(resultat.territoire_code)) {
    return resultat;
  }
  return {
    ...resultat,
    chantiers: resultat.chantiers
      .map((chantier) => ({
        ...chantier,
        tendance: null,
        categories_signalement: chantier.categories_signalement.filter(
          (libelle) => libelle !== LIBELLE_TENDANCE_BAISSE,
        ),
      }))
      .filter((chantier) => chantier.categories_signalement.length > 0),
  };
}

export function createGetChantiersSignalesTool({
  getChantiersSignalesListQuery,
  territoireResolver,
}: {
  getChantiersSignalesListQuery: GetChantiersSignalesListQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Récupère les chantiers signalés (rubrique "Chantiers signalés" de PILOTE) pour un territoire et un jalon.

Un chantier est signalé s'il répond à au moins une catégorie de signalement. Les catégories diffèrent selon la maille :
- Au national : taux_avancement_non_calcule, absence_taux_avancement_departemental, meteo_synthese_non_renseignees, proposition_valeur_avancement
- Au régional/départemental : retard_mediane, tendance_baisse, meteo_synthese_non_renseignees, proposition_valeur_avancement

Utilise categorie_signalement pour restreindre à une seule catégorie précise (ex: "quels chantiers ont une PVA ?" -> categorie_signalement=proposition_valeur_avancement). Sans ce filtre, tous les chantiers signalés sont retournés avec leurs catégories regroupées.

⚠️ "Signalé" ne veut pas dire "en retard" ni "en difficulté" : les chantiers en difficulté (météo dégradée) ne sont jamais inclus au seul motif de leur météo. Pour les chantiers en difficulté ou en retard, utilise get_chantiers(view=en_difficulte / en_retard).`,
      inputSchema: getChantiersSignalesInputSchema,
      execute: async (
        input: GetChantiersSignalesInput,
      ): Promise<GetChantiersSignalesOutput> => {
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

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );

        const resultats = await Promise.all(
          codes.map(async (code): Promise<ResultatTerritoire> => {
            const { maille } = territoireCodeVersMailleCodeInsee(code);

            if (
              input.categorie_signalement &&
              !categoriesApplicables(maille).includes(
                input.categorie_signalement,
              )
            ) {
              return {
                territoire_code: code,
                chantiers: [],
                non_applicable: {
                  raison: raisonNonApplicable(
                    input.categorie_signalement,
                    maille,
                  ),
                },
              };
            }

            const resultat = await getChantiersSignalesListQuery.execute({
              territoireCode: code,
              jalon: input.jalon,
              chantierIds: filteredChantierIds ?? chantiersAccessibles,
              categorieSignalement: input.categorie_signalement,
            });

            return masquerCategoriesNonAccessibles(
              resultat,
              territoiresAccessibles,
            );
          }),
        );

        return {
          resultats,
          _output_instructions: getOutputInstructions(
            resultats,
            territoiresAccessibles,
          ),
        };
      },
    });
  };
}
