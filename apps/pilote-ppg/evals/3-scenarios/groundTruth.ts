import { getPrisma } from "@/server/db/PrismaTransaction";
import type { GetChantiersOutput } from "@/server/albert/tools/getChantiers";
import type {
  GetTauxAvancementTerritoireOutput,
  GetTauxAvancementTerritoireResult,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { EvalUser } from "../world";
import { createDataTools, executeTool } from "./dataTools";
import { JALON_COURANT } from "./territoires";
import { chantiersDistincts, type GroundTruth, type TruthScope } from "./truth";

/**
 * Ce que la réponse doit couvrir, lu par les outils de production avec les
 * habilitations du profil. Taux global et médiane sont des agrégats calculés
 * par du code déjà validé au niveau 2 : les recalculer ici dupliquerait la
 * formule, et un arrondi divergent ferait échouer un critère pour rien.
 */
export async function readGroundTruth({
  scope,
  user,
}: {
  scope: TruthScope;
  user: EvalUser;
}): Promise<GroundTruth> {
  const tools = createDataTools({ user });
  const jalons = scope.jalons ?? [JALON_COURANT];
  const includeSousTerritoires = scope.includeSousTerritoires ?? false;

  const tauxAvancement: GetTauxAvancementTerritoireResult[] = [];
  const chantiersEnRetard: GetChantiersResult[] = [];
  const chantiersEnDifficulte: GetChantiersResult[] = [];

  for (const territoireCode of scope.territoires) {
    for (const jalon of jalons) {
      const taux = await executeTool<GetTauxAvancementTerritoireOutput>({
        tool: tools.getTauxAvancementTerritoire,
        input: {
          territoire_code: territoireCode,
          jalon,
          include_sous_territoires: includeSousTerritoires,
        },
      });
      tauxAvancement.push(...taux.resultats);

      const lireVue = (view: "en_retard" | "en_difficulte") =>
        executeTool<GetChantiersOutput>({
          tool: tools.getChantiers,
          input: {
            territoire_code: territoireCode,
            jalon,
            view,
            include_sous_territoires: includeSousTerritoires,
          },
        });

      chantiersEnRetard.push(...(await lireVue("en_retard")).resultats);
      chantiersEnDifficulte.push(...(await lireVue("en_difficulte")).resultats);
    }
  }

  const territoirePrincipal = scope.territoires[0];

  const indicateurs: GetChantierIndicateursResult[] = [];
  if (scope.indicateurs) {
    const signales = chantiersDistincts([
      ...chantiersEnRetard,
      ...chantiersEnDifficulte,
    ]);
    for (const chantier of signales) {
      const resultat = await executeTool<GetChantierIndicateursOutput>({
        tool: tools.getIndicateurs,
        input: {
          chantier_id: chantier.id,
          territoire_code: territoirePrincipal,
          jalon: jalons[0],
        },
      });
      indicateurs.push(resultat.resultats);
    }
  }

  const commentaires: GetChantierCommentairesOutput[] = [];
  for (const chantierId of scope.chantiersCommentes ?? []) {
    commentaires.push(
      await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: { chantier_id: chantierId, territoire_code: territoirePrincipal },
      }),
    );
  }

  const codes = [
    ...new Set([
      ...scope.territoires,
      ...tauxAvancement.map((resultat) => resultat.territoire_code),
    ]),
  ];
  const territoires = await getPrisma().territoire.findMany({
    where: { code: { in: codes } },
    orderBy: { code: "asc" },
  });

  return {
    territoires: territoires.map((territoire) => ({
      code: territoire.code,
      nom: territoire.nom,
      maille: territoire.maille,
    })),
    tauxAvancement,
    chantiersEnRetard,
    chantiersEnDifficulte,
    indicateurs,
    commentaires,
  };
}
