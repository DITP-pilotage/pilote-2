import { tool } from "ai";
import { z } from "zod";
import type {
  ChantierIndicateursSansViVc,
  GetIndicateursSansViVcQuery,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import { getIndicateursNonAJourInputSchema } from "@/server/albert/tools/getIndicateursNonAJour";
import {
  resolveIndicateursScope,
  scopeAccessFields,
} from "@/server/albert/tools/indicateursScope";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

export const getIndicateursSansViVcInputSchema =
  getIndicateursNonAJourInputSchema.extend({
    missing: z
      .enum(["vi", "vc", "vi_or_vc"])
      .optional()
      .default("vi_or_vc")
      .describe(
        "Valeur manquante recherchée : « vi » (sans valeur initiale), « vc » (sans valeur cible), « vi_or_vc » (l'une ou l'autre).",
      ),
  });

type GetIndicateursSansViVcInput = z.infer<
  typeof getIndicateursSansViVcInputSchema
>;

export type GetIndicateursSansViVcOutput = {
  jalon: number;
  resultats: ChantierIndicateursSansViVc[];
  acces_refuse?: boolean;
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
};

export function createGetIndicateursSansViVcTool({
  getIndicateursSansViVcQuery,
  getIndicateurContexteQuery,
}: {
  getIndicateursSansViVcQuery: GetIndicateursSansViVcQuery;
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie les indicateurs dont le taux d'avancement ne peut pas être calculé parce que leur valeur initiale (VI) ou leur valeur cible (VC) manque, par chantier, indicateur et maille, avec le nombre de territoires concernés. La VC s'apprécie au jalon en cours, renvoyé dans \`jalon\`.
- \`missing\` : "vi" pour les indicateurs sans VI, "vc" pour ceux sans VC, "vi_or_vc" (défaut) pour les deux.
- Le détail par territoire, avec ses valeurs manquantes, n'est renvoyé qu'avec \`indicateur_ids\` ou \`territoire_code\` ; sinon, seulement les compteurs par maille.
- Liste vide : aucune VI ni VC manquante sur ce périmètre, ce qui ne prouve pas que le taux est calculé partout (l'indicateur peut ne pas être suivi ici, ou son identifiant être erroné).
- \`acces_refuse\` : l'utilisateur n'a accès ni à ce territoire, ni à aucun des chantiers ou indicateurs demandés.
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme complets.
Dans ta réponse, dis toujours pourquoi le taux d'avancement ne peut pas être calculé : la valeur initiale, la valeur cible, ou les deux, manquent.
Utilise-le pour : « taux d'avancement qui ne peut pas être calculé », « indicateurs sans VI », « sans VC », « sans VI ni VC », « valeurs initiales ou cibles manquantes ».
Ne l'utilise pas pour : la mise à jour des données (« non à jour », « en retard », « données périmées ») → get_indicateurs_non_a_jour.`,
      inputSchema: getIndicateursSansViVcInputSchema,
      execute: async (
        input: GetIndicateursSansViVcInput,
      ): Promise<GetIndicateursSansViVcOutput> => {
        const jalon = getAnneeDateDeBascule(
          new Date(),
          configuration().dateBasculeAffichageValeursAnneePrecedente,
        );

        const scope = await resolveIndicateursScope({
          input,
          territoiresAccessibles,
          chantiersAccessibles,
          getIndicateurContexteQuery,
        });

        if (scope.accesRefuse) {
          return { jalon, resultats: [], acces_refuse: true };
        }

        const resultats = await getIndicateursSansViVcQuery.execute({
          chantierIds: scope.chantierIds,
          territoireCodes: scope.territoireCodes,
          indicateurIds: scope.indicateurIds,
          jalon,
          missing: input.missing,
          withTerritoiresDetail: scope.withTerritoiresDetail,
        });

        return { jalon, resultats, ...scopeAccessFields(scope) };
      },
    });
  };
}
