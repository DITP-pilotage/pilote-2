import { tool } from "ai";
import { z } from "zod";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import type {
  GetIndicateursSansViVcQuery,
  LigneIndicateurSansViVc,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  chantierIdsIndicateursSchema,
  CONSIGNE_ACCES_REFUSE,
  CONSIGNE_DETAIL_TROP_VOLUMINEUX,
  indicateurIdsSchema,
  perimetreIndicateursSchema,
  renvoyerChantiers,
  resoudreAccesIndicateurs,
  resoudreDetail,
  type ChampsAcces,
  type ChampsDetail,
  type ChantierRenvoye,
} from "@/server/albert/tools/socleValeursIndicateurs";

export const getValeursInitialesCiblesManquantesInputSchema = z.object({
  chantier_ids: chantierIdsIndicateursSchema,
  indicateur_ids: indicateurIdsSchema,
  perimetre: perimetreIndicateursSchema,
  detail: z
    .enum(["compteurs", "territoires"])
    .optional()
    .default("compteurs")
    .describe(
      "compteurs : par chantier, indicateur et maille, le nombre de territoires concernés. territoires : en plus, chaque territoire concerné avec ses valeurs manquantes et sa dernière valeur cible connue. Choisis territoires seulement quand la demande nomme les territoires ou le détail (« sur quels territoires », « les départements sans cible », « le détail par territoire »).",
    ),
  valeurs: z
    .enum(["vi", "vc", "vi_et_vc"])
    .optional()
    .default("vi_et_vc")
    .describe(
      "vi : valeurs initiales manquantes. vc : valeurs cibles manquantes. vi_et_vc : un territoire remonte dès qu'il manque l'une ou l'autre (« ni VI ni VC », « VI ou VC manquantes »).",
    ),
});

type GetValeursInitialesCiblesManquantesInput = z.infer<
  typeof getValeursInitialesCiblesManquantesInputSchema
>;

type ValeurManquante = "valeur initiale" | "valeur cible";

type TerritoireRenvoye = {
  code: string;
  nom: string | null;
  valeurs_manquantes: ValeurManquante[];
  derniere_vc_connue?: { valeur: number; jalon: number } | null;
};

type ChampsMaille = {
  nb_territoires_sans_vi?: number;
  nb_territoires_sans_vc?: number;
  territoires?: TerritoireRenvoye[];
};

export type GetValeursInitialesCiblesManquantesOutput = ChampsAcces &
  ChampsDetail & {
    jalon: number;
    resultats: ChantierRenvoye<object, ChampsMaille>[];
  };

function renvoyerTerritoire(ligne: LigneIndicateurSansViVc): TerritoireRenvoye {
  return {
    code: ligne.territoireCode,
    nom: ligne.territoireNom,
    valeurs_manquantes: [
      ...(ligne.viManquante ? (["valeur initiale"] as const) : []),
      ...(ligne.vcManquante ? (["valeur cible"] as const) : []),
    ],
    ...(ligne.vcManquante && { derniere_vc_connue: ligne.derniereVcConnue }),
  };
}

export function createGetValeursInitialesCiblesManquantesTool({
  getIndicateursSansViVcQuery,
  getIndicateursIdentiteQuery,
  territoireResolver,
}: {
  getIndicateursSansViVcQuery: GetIndicateursSansViVcQuery;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
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
      description: `Renvoie les indicateurs dont la valeur initiale (VI) ou la valeur cible (VC) manque, par chantier, indicateur et maille, avec le nombre de territoires concernés parmi les territoires applicables et accessibles. Une valeur à 0 est renseignée.
- Une VC manquante s'entend toujours sur le jalon renvoyé dans \`jalon\`, le jalon en cours : cite-le dans ta réponse, y compris si la demande vise une autre année, sans clarifier. Ce jalon prime sur celui de la session.
- \`valeurs\` : "vi", "vc", ou "vi_et_vc" quand la demande vise les deux. Distingue toujours les motifs « VI manquante » et « VC manquante » ; un même territoire peut cumuler les deux. Si l'outil est appelé avec get_valeurs_avancement_non_a_jour, rédige une seule synthèse par chantier, indicateur et maille, avec le motif « VA non à jour » en plus.
- \`detail\` : "compteurs" (défaut) pour une question vague ; "territoires" quand la demande nomme les territoires ou le détail. Après des compteurs, propose le détail sur un sous-ensemble, sans le faire d'office.
- \`derniere_vc_connue\` : écris « Dernière cible connue : 100, jalon 2024 » ; null s'écrit « Aucune valeur cible connue ». Elle contextualise et ne remplace jamais la cible manquante.
- Liste vide : dis explicitement qu'aucun indicateur ne répond aux critères sur ce périmètre. Cela ne dit rien des taux d'avancement : ne présente pas ce résultat comme la preuve qu'ils sont tous calculables.
- ${CONSIGNE_DETAIL_TROP_VOLUMINEUX}
- ${CONSIGNE_ACCES_REFUSE}
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme complets.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme complet ni comme incomplet.
Utilise-le pour : « sans cible », « cible à mettre à jour », « sans VI », « sans VC », « sans valeur initiale », « valeur initiale à mettre à jour », « valeurs initiales ou cibles manquantes » ; avec get_valeurs_avancement_non_a_jour en parallèle quand la demande vise aussi les valeurs d'avancement. « Non à jour » ou « à mettre à jour » sans type de valeurs → clarify_with_choices d'abord ; appelle cet outil si l'utilisateur choisit ensuite les VI et VC ou les trois.
Ne l'utilise pas pour : la fraîcheur des valeurs d'avancement → get_valeurs_avancement_non_a_jour ; les chantiers au taux d'avancement non calculé → get_chantiers_signales.`,
      inputSchema: getValeursInitialesCiblesManquantesInputSchema,
      execute: async (
        input: GetValeursInitialesCiblesManquantesInput,
      ): Promise<GetValeursInitialesCiblesManquantesOutput> => {
        const jalon = getAnneeDateDeBascule(
          new Date(),
          configuration().dateBasculeAffichageValeursAnneePrecedente,
        );

        const acces = await resoudreAccesIndicateurs({
          chantierIds: input.chantier_ids,
          indicateurIds: input.indicateur_ids,
          perimetre: input.perimetre,
          territoiresAccessibles,
          chantiersAccessibles,
          territoireResolver,
          getIndicateursIdentiteQuery,
        });

        if (acces.statut === "sans_resultat") {
          return {
            jalon,
            detail: input.detail,
            resultats: [],
            ...acces.champsAcces,
          };
        }

        const lignes = await getIndicateursSansViVcQuery.execute({
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
          jalon,
          valeurs: input.valeurs,
        });

        const { avecTerritoires, champsDetail } = resoudreDetail({
          detail: input.detail,
          nbLignes: lignes.length,
        });

        return {
          jalon,
          ...champsDetail,
          resultats: renvoyerChantiers({
            lignes,
            champsIndicateur: () => ({}),
            champsMaille: (lignesDeLaMaille) => ({
              ...(input.valeurs !== "vc" && {
                nb_territoires_sans_vi: lignesDeLaMaille.filter(
                  (ligne) => ligne.viManquante,
                ).length,
              }),
              ...(input.valeurs !== "vi" && {
                nb_territoires_sans_vc: lignesDeLaMaille.filter(
                  (ligne) => ligne.vcManquante,
                ).length,
              }),
              ...(avecTerritoires && {
                territoires: lignesDeLaMaille.map(renvoyerTerritoire),
              }),
            }),
          }),
          ...acces.champsAcces,
        };
      },
    });
  };
}
