import { tool } from "ai";
import { z } from "zod";
import { libelleMaille } from "@/server/albert/tools/libelles";
import type {
  GetIndicateursNonAJourQuery,
  LigneIndicateurNonAJour,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
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

export const getIndicateursNonAJourInputSchema = z.object({
  chantier_ids: chantierIdsIndicateursSchema,
  indicateur_ids: indicateurIdsSchema,
  perimetre: perimetreIndicateursSchema,
  detail: z
    .enum(["compteurs", "territoires"])
    .optional()
    .default("compteurs")
    .describe(
      "compteurs : par chantier, indicateur et maille, le nombre de territoires dont la valeur d'avancement est en retard. territoires : en plus, chaque territoire concerné avec ses dates. Choisis territoires seulement quand la demande nomme les territoires ou le détail (« sur quels territoires », « les départements dont la valeur d'avancement n'est pas à jour », « le détail par territoire »).",
    ),
});

type GetIndicateursNonAJourInput = z.infer<
  typeof getIndicateursNonAJourInputSchema
>;

type TerritoireEnRetardRenvoye = {
  code: string;
  nom: string | null;
  date_derniere_valeur: string | null;
  mise_a_jour_attendue_depuis: string | null;
};

type MailleRenvoyee = {
  maille: ReturnType<typeof libelleMaille>;
  nb_territoires_en_retard: number;
  territoires_en_retard?: TerritoireEnRetardRenvoye[];
};

type IndicateurRenvoye = {
  id: string;
  nom: string;
  periodicite: string | null;
  delai_disponibilite_mois: number | null;
  mailles: MailleRenvoyee[];
};

export type ChantierNonAJourRenvoye = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurRenvoye[];
};

export type GetIndicateursNonAJourOutput = ListesSignalees & {
  detail: GetIndicateursNonAJourInput["detail"];
  detail_trop_volumineux?: true;
  resultats: ChantierNonAJourRenvoye[];
  acces_refuse?: true;
};

function renvoyerMailles({
  lignes,
  avecTerritoires,
}: {
  lignes: LigneIndicateurNonAJour[];
  avecTerritoires: boolean;
}): MailleRenvoyee[] {
  return MAILLES_ORDER.flatMap((maille) => {
    const lignesDeLaMaille = lignes.filter((ligne) => ligne.maille === maille);
    if (lignesDeLaMaille.length === 0) return [];
    return [
      {
        maille: libelleMaille({ maille }),
        nb_territoires_en_retard: lignesDeLaMaille.length,
        ...(avecTerritoires && {
          territoires_en_retard: lignesDeLaMaille.map((ligne) => ({
            code: ligne.territoireCode,
            nom: ligne.territoireNom,
            date_derniere_valeur: ligne.dateDerniereValeur,
            mise_a_jour_attendue_depuis: ligne.miseAJourAttendueDepuis,
          })),
        }),
      },
    ];
  });
}

function renvoyerChantiersNonAJour({
  lignes,
  avecTerritoires,
}: {
  lignes: LigneIndicateurNonAJour[];
  avecTerritoires: boolean;
}): ChantierNonAJourRenvoye[] {
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
        periodicite: lignesDeLIndicateur[0].periodicite,
        delai_disponibilite_mois: lignesDeLIndicateur[0].delaiDisponibiliteMois,
        mailles: renvoyerMailles({
          lignes: lignesDeLIndicateur,
          avecTerritoires,
        }),
      })),
    }),
  );
}

export function createGetIndicateursNonAJourTool({
  getIndicateursNonAJourQuery,
  getIndicateursIdentiteQuery,
  territoireResolver,
}: {
  getIndicateursNonAJourQuery: GetIndicateursNonAJourQuery;
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
      description: `N'appelle cet outil que si la demande nomme la valeur d'avancement (« VA », « valeur d'avancement », « dernière valeur ») ou que les échanges l'ont établie. Le mot « indicateur » ou « donnée » ne nomme pas ce type de valeurs : « quels indicateurs sont non à jour sur le CH-018 ? », « quels indicateurs ont un retard de mise à jour ? », « données périmées » appellent clarify_with_choices, seul, et pas cet outil. Renvoie les indicateurs dont les valeurs d'avancement ne sont pas à jour, par chantier, indicateur et maille, avec le nombre de territoires concernés. Une valeur d'avancement n'est pas à jour quand sa date théorique de mise à jour (date de la dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur s'applique.
- \`detail\` : "compteurs" (défaut) pour une question vague (« quels chantiers ont des valeurs d'avancement à mettre à jour ? ») ; "territoires" quand la demande nomme les territoires ou le détail (« sur quels territoires le CH-018 a des valeurs d'avancement non à jour ? », « … et affiche le détail par territoire »).
- Après des compteurs, propose à l'utilisateur le détail territoire par territoire sur un sous-ensemble (un chantier, un indicateur ou un territoire), sans le faire d'office.
- \`perimetre\` restreint les territoires considérés, dans les deux modes ; il ne déclenche pas le détail.
- Si l'outil est appelé avec get_indicateurs_sans_vi_vc, rédige une seule synthèse par chantier, indicateur et maille, qui distingue les motifs « VA non à jour », « VI manquante » et « VC manquante ».
- Une région seule (« en Bretagne ») est une SELECTION de son seul code ; ses départements n'en font partie que si la demande les cite.
- Liste vide : aucun indicateur non à jour trouvé sur ce périmètre, ce qui ne prouve pas que les données sont à jour (l'indicateur peut ne pas être suivi ici).
- \`detail_trop_volumineux\` : le détail par territoire est trop volumineux, les compteurs sont renvoyés à la place. Rédige toujours ta réponse complète à partir de ces compteurs, sans les présenter comme le détail demandé. Termine-la en précisant que ce détail est trop volumineux, sans chiffrer ce volume, et qu'on peut l'obtenir en réduisant la recherche à un chantier, un indicateur ou un territoire. N'appelle pas clarify_with_choices, ne pose aucune question avant d'avoir donné les compteurs, et ne relance pas l'outil d'office.
- \`date_derniere_valeur\` null : aucune valeur n'a jamais été renseignée sur ce territoire.
- \`mise_a_jour_attendue_depuis\` null alors que \`date_derniere_valeur\` est renseignée : la date théorique n'a pas pu être calculée.
- \`acces_refuse\` : l'utilisateur n'a accès ni à ces territoires, ni à aucun des chantiers ou indicateurs demandés.
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme à jour.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme à jour ni comme non à jour.
Un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- les VI ou VC manquantes → get_indicateurs_sans_vi_vc ;
- les chantiers en retard au sens de l'avancement (écart à la médiane) → get_chantiers (view "en_retard").`,
      inputSchema: getIndicateursNonAJourInputSchema,
      execute: async (
        input: GetIndicateursNonAJourInput,
      ): Promise<GetIndicateursNonAJourOutput> => {
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
            detail: input.detail,
            resultats: [],
            acces_refuse: true,
            ...acces.listes,
          };
        }

        if (acces.statut === "rien_a_interroger") {
          return { detail: input.detail, resultats: [], ...acces.listes };
        }

        const lignes = await getIndicateursNonAJourQuery.execute({
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
        });

        const detailTropVolumineux =
          input.detail === "territoires" &&
          lignes.length > SEUIL_LIGNES_TERRITOIRES;
        const avecTerritoires =
          input.detail === "territoires" && !detailTropVolumineux;

        return {
          detail: avecTerritoires ? "territoires" : "compteurs",
          ...(detailTropVolumineux && {
            detail_trop_volumineux: true as const,
          }),
          resultats: renvoyerChantiersNonAJour({ lignes, avecTerritoires }),
          ...acces.listes,
        };
      },
    });
  };
}
