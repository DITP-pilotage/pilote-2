import { tool } from "ai";
import { z } from "zod";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { libelleMaille } from "@/server/albert/tools/libelles";
import type {
  GetIndicateursSansViVcQuery,
  LigneIndicateurSansViVc,
  ValeursRecherchees,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  chantierIdsIndicateursSchema,
  indicateurIdsSchema,
  MAILLES_ORDER,
  perimetreIndicateursSchema,
  resoudreAccesIndicateurs,
  SEUIL_LIGNES_TERRITOIRES,
  type ListesSignalees,
} from "@/server/albert/tools/rechercheIndicateurs";

export const getIndicateursSansViVcInputSchema = z.object({
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

type GetIndicateursSansViVcInput = z.infer<
  typeof getIndicateursSansViVcInputSchema
>;

type ValeurManquante = "valeur initiale" | "valeur cible";

type TerritoireRenvoye = {
  code: string;
  nom: string | null;
  valeurs_manquantes: ValeurManquante[];
  derniere_vc_connue?: { valeur: number; jalon: number } | null;
};

type MailleRenvoyee = {
  maille: ReturnType<typeof libelleMaille>;
  nb_territoires_sans_vi?: number;
  nb_territoires_sans_vc?: number;
  territoires?: TerritoireRenvoye[];
};

type ChantierRenvoye = {
  chantier: { id: string; nom: string };
  indicateurs: { id: string; nom: string; mailles: MailleRenvoyee[] }[];
};

export type GetIndicateursSansViVcOutput = ListesSignalees & {
  jalon: number;
  detail: GetIndicateursSansViVcInput["detail"];
  detail_trop_volumineux?: true;
  resultats: ChantierRenvoye[];
  acces_refuse?: true;
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

function renvoyerMailles({
  lignes,
  valeurs,
  avecTerritoires,
}: {
  lignes: LigneIndicateurSansViVc[];
  valeurs: ValeursRecherchees;
  avecTerritoires: boolean;
}): MailleRenvoyee[] {
  return MAILLES_ORDER.flatMap((maille) => {
    const lignesDeLaMaille = lignes.filter((ligne) => ligne.maille === maille);
    if (lignesDeLaMaille.length === 0) return [];
    return [
      {
        maille: libelleMaille({ maille }),
        ...(valeurs !== "vc" && {
          nb_territoires_sans_vi: lignesDeLaMaille.filter(
            (ligne) => ligne.viManquante,
          ).length,
        }),
        ...(valeurs !== "vi" && {
          nb_territoires_sans_vc: lignesDeLaMaille.filter(
            (ligne) => ligne.vcManquante,
          ).length,
        }),
        ...(avecTerritoires && {
          territoires: lignesDeLaMaille.map(renvoyerTerritoire),
        }),
      },
    ];
  });
}

function renvoyerChantiers({
  lignes,
  valeurs,
  avecTerritoires,
}: {
  lignes: LigneIndicateurSansViVc[];
  valeurs: ValeursRecherchees;
  avecTerritoires: boolean;
}): ChantierRenvoye[] {
  return [...Map.groupBy(lignes, (ligne) => ligne.chantierId).values()].map(
    (lignesDuChantier) => ({
      chantier: {
        id: lignesDuChantier[0].chantierId,
        nom: lignesDuChantier[0].chantierNom,
      },
      indicateurs: [
        ...Map.groupBy(
          lignesDuChantier,
          (ligne) => ligne.indicateurId,
        ).values(),
      ].map((lignesDeLIndicateur) => ({
        id: lignesDeLIndicateur[0].indicateurId,
        nom: lignesDeLIndicateur[0].indicateurNom,
        mailles: renvoyerMailles({
          lignes: lignesDeLIndicateur,
          valeurs,
          avecTerritoires,
        }),
      })),
    }),
  );
}

export function createGetIndicateursSansViVcTool({
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
- Une VC manquante s'entend toujours sur le jalon renvoyé dans \`jalon\`, le jalon en cours : cite-le dans ta réponse, y compris si la demande vise une autre année. Ce jalon prime sur celui de la session.
- \`valeurs\` : "vi", "vc", ou "vi_et_vc" quand la demande vise les deux. Distingue toujours les motifs « VI manquante » et « VC manquante » ; un même territoire peut cumuler les deux.
- \`detail\` : "compteurs" (défaut) pour une question vague ; "territoires" quand la demande nomme les territoires ou le détail. Après des compteurs, propose le détail sur un sous-ensemble, sans le faire d'office.
- \`derniere_vc_connue\` : écris « Dernière cible connue : 100, jalon 2024 » ; null s'écrit « Aucune valeur cible connue ». Elle contextualise et ne remplace jamais la cible manquante.
- Liste vide : dis explicitement qu'aucun indicateur ne répond aux critères sur ce périmètre. Cela ne dit rien des taux d'avancement : ne présente pas ce résultat comme la preuve qu'ils sont tous calculables.
- \`detail_trop_volumineux\` : le détail par territoire est trop volumineux, les compteurs sont renvoyés à la place. Rédige toujours ta réponse complète à partir de ces compteurs, sans les présenter comme le détail demandé. Termine-la en précisant que ce détail est trop volumineux, sans chiffrer ce volume, et qu'on peut l'obtenir en réduisant la recherche à un chantier, un indicateur ou un territoire. N'appelle pas clarify_with_choices, ne pose aucune question avant d'avoir donné les compteurs, et ne relance pas l'outil d'office.
- \`acces_refuse\` : l'utilisateur n'a accès ni à ces territoires, ni à aucun des chantiers ou indicateurs demandés.
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme complets.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme complet ni comme incomplet.
Utilise-le pour : « sans cible », « sans VI », « sans VC », « sans valeur initiale », « valeurs initiales ou cibles manquantes » ; avec get_indicateurs_non_a_jour en parallèle quand la demande vise aussi les valeurs d'avancement.
Ne l'utilise pas pour : la fraîcheur des valeurs d'avancement → get_indicateurs_non_a_jour ; les chantiers au taux d'avancement non calculé → get_chantiers_signales.`,
      inputSchema: getIndicateursSansViVcInputSchema,
      execute: async (
        input: GetIndicateursSansViVcInput,
      ): Promise<GetIndicateursSansViVcOutput> => {
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

        if (acces.statut === "refuse") {
          return {
            jalon,
            detail: input.detail,
            resultats: [],
            acces_refuse: true,
            ...acces.listes,
          };
        }

        if (acces.statut === "rien_a_interroger") {
          return {
            jalon,
            detail: input.detail,
            resultats: [],
            ...acces.listes,
          };
        }

        const lignes = await getIndicateursSansViVcQuery.execute({
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
          jalon,
          valeurs: input.valeurs,
        });

        const detailTropVolumineux =
          input.detail === "territoires" &&
          lignes.length > SEUIL_LIGNES_TERRITOIRES;
        const avecTerritoires =
          input.detail === "territoires" && !detailTropVolumineux;

        return {
          jalon,
          detail: avecTerritoires ? "territoires" : "compteurs",
          ...(detailTropVolumineux && {
            detail_trop_volumineux: true as const,
          }),
          resultats: renvoyerChantiers({
            lignes,
            valeurs: input.valeurs,
            avecTerritoires,
          }),
          ...acces.listes,
        };
      },
    });
  };
}
