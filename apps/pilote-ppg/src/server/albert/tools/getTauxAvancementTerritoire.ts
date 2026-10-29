import { tool } from "ai";
import { z } from "zod";
import { MailleNonAutoriséeErreur } from "@/shared/errors/authorization-errors";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { getContainer } from "@/server/dependances";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";
import { determineMaille } from "@/shared/maille/determineMaille";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";

export const getTauxAvancementTerritoireInputSchema = z.object({
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION,
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
      variantesPerimetre.TOUTES_REGIONS,
      variantesPerimetre.TOUS_DEPARTEMENTS,
    ])
    .describe(
      descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
          "TOUTES_REGIONS",
          "TOUS_DEPARTEMENTS",
        ],
      }),
    ),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  tri: z
    .enum(["taux_decroissant", "taux_croissant"])
    .default("taux_decroissant")
    .describe(
      "Ordre des territoires selon leur taux d'avancement ; les territoires sans donnée viennent en dernier.",
    ),
  limite: z
    .number()
    .int()
    .min(1)
    .max(101)
    .optional()
    .describe(
      "Nombre maximal de territoires renvoyés, après le tri (ex: 5 pour « les 5 départements qui avancent le mieux »). Omettre pour tous.",
    ),
});

type ClassementTaux = {
  tri: "taux_decroissant" | "taux_croissant";
  limite?: number;
};

export type GetTauxAvancementTerritoireResult = {
  territoire_code: string;
  /** Le nom à écrire dans la réponse : sans lui, Albert désignait le territoire par son code. */
  territoire_nom: string | null;
  jalon: number;
  taux_avancement_global: string;
  mediane_repartition: string;
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
};

function formatPourcentage(value: number | null | undefined): string {
  return `${value?.toFixed(0) ?? "- "}%`;
}

export type GetTauxAvancementTerritoireOutput = {
  resultats: GetTauxAvancementTerritoireResult[];
  /** Le nombre de territoires du périmètre, avant la limite. Seulement avec un classement. */
  total?: number;
  tronque?: true;
};

/** Trie sur la valeur numérique, avant le formatage en « 46 % » ; sans donnée en dernier. */
function classerCodes({
  codes,
  tauxParTerritoire,
  classement,
}: {
  codes: string[];
  tauxParTerritoire: Map<string, number | null>;
  classement: ClassementTaux;
}): string[] {
  const sens = classement.tri === "taux_decroissant" ? -1 : 1;
  const classes = [...codes].sort((codeA, codeB) => {
    const tauxA = tauxParTerritoire.get(codeA) ?? null;
    const tauxB = tauxParTerritoire.get(codeB) ?? null;
    if (tauxA === null) return tauxB === null ? 0 : 1;
    if (tauxB === null) return -1;
    return sens * (tauxA - tauxB);
  });
  return classement.limite === undefined
    ? classes
    : classes.slice(0, classement.limite);
}

/**
 * La collecte de `get_taux_avancement_territoire`, partagée avec les outils
 * d'encart. Seul l'outil passe un `classement` : l'encart garde l'ordre du
 * resolver, la région avant ses départements.
 */
export async function collecterTauxAvancement({
  input,
  classement,
  territoireResolver,
  getTerritoiresIdentiteQuery,
  habilitations,
}: {
  input: {
    perimetre: Perimetre;
    jalon: number;
  };
  classement?: ClassementTaux;
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
  habilitations: Habilitations;
}): Promise<GetTauxAvancementTerritoireOutput> {
  const codesDuPerimetre = await territoireResolver.resoudre(input.perimetre);

  const chantiersContainer = getContainer("chantiers");
  const chantierIds = await chantiersContainer
    .resolve("getChantiersHabilitesQuery")
    .execute(habilitations);
  const récupérerStatistiquesUseCase = chantiersContainer.resolve(
    "récupérerStatistiquesAvancementChantiersUseCase",
  );
  const tauxParTerritoire = new Map(
    (
      await chantiersContainer
        .resolve("recupererTauxAvancementTerritoireQuery")
        .executePourTerritoires({
          territoireCodes: codesDuPerimetre,
          jalon: input.jalon,
          habilitations,
        })
    ).map((resultat) => [resultat.territoire_code, resultat.taux_avancement]),
  );

  const nomParTerritoire = new Map(
    (await getTerritoiresIdentiteQuery.execute()).map((territoire) => [
      territoire.code,
      territoire.nom,
    ]),
  );

  const codes = classement
    ? classerCodes({ codes: codesDuPerimetre, tauxParTerritoire, classement })
    : codesDuPerimetre;

  const mailles = new Set(codes.map(determineMaille));
  const statsByMaille = new Map<Maille, number | null>();

  for (const maille of mailles) {
    const repartitionMaille: Maille =
      maille === "nationale" ? "departementale" : maille;

    try {
      const stats = await récupérerStatistiquesUseCase.run(
        chantierIds,
        repartitionMaille,
        habilitations,
        input.jalon,
      );
      statsByMaille.set(maille, stats?.médiane ?? null);
    } catch (error) {
      if (!(error instanceof MailleNonAutoriséeErreur)) {
        throw error;
      }
      statsByMaille.set(maille, null);
    }
  }

  const resultats = codes.map((code) => {
    const maille = determineMaille(code);
    const taux_avancement_global = tauxParTerritoire.get(code) ?? null;

    const mediane_repartition = statsByMaille.get(maille) ?? null;

    let position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null =
      null;
    if (taux_avancement_global !== null && mediane_repartition !== null) {
      const ecart = taux_avancement_global - mediane_repartition;
      if (ecart <= -10) {
        position_mediane = "EN_RETARD";
      } else if (ecart >= 10) {
        position_mediane = "EN_AVANCE";
      } else {
        position_mediane = "DANS_LA_MEDIANE";
      }
    }

    return {
      territoire_code: code,
      territoire_nom: nomParTerritoire.get(code) ?? null,
      jalon: input.jalon,
      taux_avancement_global: formatPourcentage(taux_avancement_global),
      mediane_repartition: formatPourcentage(mediane_repartition),
      position_mediane,
    };
  });

  if (!classement) return { resultats };
  return {
    resultats,
    total: codesDuPerimetre.length,
    ...(codes.length < codesDuPerimetre.length && { tronque: true as const }),
  };
}

export function createGetTauxAvancementTerritoireTool({
  territoireResolver,
  getTerritoiresIdentiteQuery,
}: {
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    return tool({
      description: `Renvoie, pour chaque territoire du périmètre, son taux d'avancement global à un jalon, la médiane des territoires de sa maille et sa position face à cette médiane.
- Pour NAT-FR, la médiane est celle des départements.
- « - % » : pas de donnée à ce jalon.
- \`territoire_nom\` : le nom à écrire dans la réponse, plutôt que le code.
- Les territoires sont triés par taux d'avancement (\`tri\`, décroissant par défaut) ; \`limite\` garde les premiers.
- \`total\` : le nombre de territoires du périmètre. \`tronque\` : la liste est coupée par \`limite\` ; dis-le (« les 5 premiers des 101 départements »).
Utilise-le pour : « quel est le taux d'avancement de la Bretagne ? », la position d'un territoire face à la médiane, une comparaison entre jalons, le taux de plusieurs territoires quand la demande nomme le taux ou un classement (« compare les taux d'avancement de X et Y », « classe les régions », « qui avance le mieux ? ») ; un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- le taux d'avancement d'un chantier → get_chantiers ;
- une comparaison générique de territoires (« compare le Nord et la Gironde », « compare la Bretagne avec ses départements ») → rediger_comparaison_territoires.`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: (input): Promise<GetTauxAvancementTerritoireOutput> =>
        collecterTauxAvancement({
          input,
          classement: { tri: input.tri, limite: input.limite },
          territoireResolver,
          getTerritoiresIdentiteQuery,
          habilitations,
        }),
    });
  };
}
