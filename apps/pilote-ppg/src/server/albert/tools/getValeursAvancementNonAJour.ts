import { tool } from "ai";
import { z } from "zod";
import type {
  GetIndicateursNonAJourQuery,
  LigneIndicateurNonAJour,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
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

export const getValeursAvancementNonAJourInputSchema = z.object({
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

type GetValeursAvancementNonAJourInput = z.infer<
  typeof getValeursAvancementNonAJourInputSchema
>;

type TerritoireEnRetardRenvoye = {
  code: string;
  nom: string | null;
  date_derniere_valeur: string | null;
  mise_a_jour_attendue_depuis: string | null;
};

type ChampsIndicateur = {
  periodicite: string | null;
  delai_disponibilite_mois: number | null;
};

type ChampsMaille = {
  nb_territoires_en_retard: number;
  territoires_en_retard?: TerritoireEnRetardRenvoye[];
};

export type GetValeursAvancementNonAJourOutput = ChampsAcces &
  ChampsDetail & {
    resultats: ChantierRenvoye<ChampsIndicateur, ChampsMaille>[];
  };

function renvoyerTerritoireEnRetard(
  ligne: LigneIndicateurNonAJour,
): TerritoireEnRetardRenvoye {
  return {
    code: ligne.territoireCode,
    nom: ligne.territoireNom,
    date_derniere_valeur: ligne.dateDerniereValeur,
    mise_a_jour_attendue_depuis: ligne.miseAJourAttendueDepuis,
  };
}

export function createGetValeursAvancementNonAJourTool({
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
      description: `N'appelle cet outil que si la demande nomme la valeur d'avancement (« VA », « valeur d'avancement », « dernière valeur ») ou sa fraîcheur (« données périmées », « retard de mise à jour », « fraîcheur »), ou que les échanges l'ont établie. « Non à jour » et « à mettre à jour » seuls ne nomment pas de type de valeurs : « quels indicateurs sont non à jour sur le CH-018 ? » appelle clarify_with_choices, seul, et pas cet outil. Renvoie les indicateurs dont les valeurs d'avancement ne sont pas à jour, par chantier, indicateur et maille, avec le nombre de territoires concernés. Une valeur d'avancement n'est pas à jour quand sa date théorique de mise à jour (date de la dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur s'applique.
- \`detail\` : "compteurs" (défaut) pour une question vague (« quels chantiers ont des valeurs d'avancement à mettre à jour ? ») ; "territoires" quand la demande nomme les territoires ou le détail (« sur quels territoires le CH-018 a des valeurs d'avancement non à jour ? », « … et affiche le détail par territoire »).
- Après des compteurs, propose à l'utilisateur le détail territoire par territoire sur un sous-ensemble (un chantier, un indicateur ou un territoire), sans le faire d'office.
- \`perimetre\` restreint les territoires considérés, dans les deux modes ; il ne déclenche pas le détail.
- Si l'outil est appelé avec get_valeurs_initiales_cibles_manquantes, rédige une seule synthèse par chantier, indicateur et maille, qui distingue les motifs « VA non à jour », « VI manquante » et « VC manquante ».
- Une région seule (« en Bretagne ») est une SELECTION de son seul code ; ses départements n'en font partie que si la demande les cite.
- Liste vide : aucun indicateur non à jour trouvé sur ce périmètre, ce qui ne prouve pas que les données sont à jour (l'indicateur peut ne pas être suivi ici).
- ${CONSIGNE_DETAIL_TROP_VOLUMINEUX}
- \`date_derniere_valeur\` null : aucune valeur n'a jamais été renseignée sur ce territoire.
- \`mise_a_jour_attendue_depuis\` null alors que \`date_derniere_valeur\` est renseignée : la date théorique n'a pas pu être calculée.
- ${CONSIGNE_ACCES_REFUSE}
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme à jour.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme à jour ni comme non à jour.
Un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- les VI ou VC manquantes → get_valeurs_initiales_cibles_manquantes ;
- les chantiers en retard au sens de l'avancement (écart à la médiane) → get_chantiers (view "en_retard").`,
      inputSchema: getValeursAvancementNonAJourInputSchema,
      execute: async (
        input: GetValeursAvancementNonAJourInput,
      ): Promise<GetValeursAvancementNonAJourOutput> => {
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
          return { detail: input.detail, resultats: [], ...acces.champsAcces };
        }

        const lignes = await getIndicateursNonAJourQuery.execute({
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
        });

        const { avecTerritoires, champsDetail } = resoudreDetail({
          detail: input.detail,
          nbLignes: lignes.length,
        });

        return {
          ...champsDetail,
          resultats: renvoyerChantiers({
            lignes,
            champsIndicateur: (ligne) => ({
              periodicite: ligne.periodicite,
              delai_disponibilite_mois: ligne.delaiDisponibiliteMois,
            }),
            champsMaille: (lignesDeLaMaille) => ({
              nb_territoires_en_retard: lignesDeLaMaille.length,
              ...(avecTerritoires && {
                territoires_en_retard: lignesDeLaMaille.map(
                  renvoyerTerritoireEnRetard,
                ),
              }),
            }),
          }),
          ...acces.champsAcces,
        };
      },
    });
  };
}
