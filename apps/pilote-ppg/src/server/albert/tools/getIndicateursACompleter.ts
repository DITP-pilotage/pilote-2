import type { $Enums } from "@prisma/client";
import { tool, type ModelMessage } from "ai";
import { z } from "zod";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import type { GetIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type {
  GetIndicateursSansViVcQuery,
  ValeursRecherchees,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type {
  GetTerritoiresIdentiteQuery,
  TerritoireIdentiteResult,
} from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { ClarifyWithChoicesOutput } from "@/server/albert/tools/clarifyWithChoices";
import {
  fusionnerLignes,
  MOTIFS_ORDER,
  versLigneACompleter,
  type Motif,
} from "@/server/albert/tools/indicateursACompleter";
import { doitDemanderPrecision } from "@/server/albert/tools/precisionTypeDeValeurs";
import { resumerIndicateursACompleter } from "@/server/albert/tools/resumeIndicateursACompleter";
import {
  indicateursACompleterVersModele,
  type GetIndicateursACompleterOutput,
} from "@/server/albert/tools/sortieIndicateursACompleter";
import {
  chantierIdsIndicateursSchema,
  CONSIGNE_ACCES_REFUSE,
  indicateurIdsSchema,
  perimetreIndicateursSchema,
  resoudreAccesIndicateurs,
} from "@/server/albert/tools/socleValeursIndicateurs";

export const getIndicateursACompleterInputSchema = z.object({
  motifs: z
    .array(z.enum(["va", "vi", "vc"]))
    .min(1)
    .max(3)
    .describe(
      `Les types de valeurs à vérifier, sans doublon, seuls ou combinés : "va" (valeur d'avancement non à jour), "vi" (valeur initiale manquante), "vc" (valeur cible manquante).
- "va" : « VA », « valeur d'avancement », « dernière valeur », « données périmées », « retard de mise à jour », « saisies en retard », « fraîcheur » ;
- "vi" : « VI », « valeur initiale » ;
- "vc" : « VC », « cible », « sans cible », « cible à mettre à jour ».
Passe les types nommés par la demande ou établis par les échanges (« les trois », « VA, VI et VC », un choix déjà fait). Sans type nommé (« non à jour », « à mettre à jour », « à compléter », « est-il à jour ? »), passe les trois : l'outil demande lui-même la précision.`,
    ),
  chantier_ids: chantierIdsIndicateursSchema,
  indicateur_ids: indicateurIdsSchema,
  perimetre: perimetreIndicateursSchema,
});

type GetIndicateursACompleterInput = z.infer<
  typeof getIndicateursACompleterInputSchema
>;

function ordonnerMotifs(motifs: Motif[]): Motif[] {
  return MOTIFS_ORDER.filter((motif) => motifs.includes(motif));
}

function valeursRecherchees(motifs: Motif[]): ValeursRecherchees {
  if (motifs.includes("vi") && motifs.includes("vc")) return "vi_et_vc";
  return motifs.includes("vi") ? "vi" : "vc";
}

const MAILLES_DE_LA_PLUS_LARGE: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

function maillesDesTerritoires({
  territoireCodes,
  territoires,
}: {
  territoireCodes: string[];
  territoires: TerritoireIdentiteResult[];
}): $Enums.Maille[] {
  const codes = new Set(territoireCodes);
  const mailles = new Set(
    territoires
      .filter((territoire) => codes.has(territoire.code))
      .map((territoire) => territoire.maille),
  );
  return MAILLES_DE_LA_PLUS_LARGE.filter((maille) => mailles.has(maille));
}

function libellePerimetreClarification({
  chantier_ids,
  indicateur_ids,
  perimetre,
}: GetIndicateursACompleterInput): string {
  const indicateurs = [...new Set(indicateur_ids)];
  const chantiers = [...new Set(chantier_ids)];
  const elements =
    indicateurs.length === 1
      ? ` sur l'${indicateurs[0]}`
      : indicateurs.length > 1
        ? ` sur les ${indicateurs.join(", ")}`
        : chantiers.length === 1
          ? ` sur le ${chantiers[0]}`
          : chantiers.length > 1
            ? ` sur les ${chantiers.join(", ")}`
            : "";
  const territoires = {
    SELECTION:
      perimetre.type === "SELECTION"
        ? ` en ${perimetre.territoire_codes.join(", ")}`
        : "",
    REGION_ET_SES_DEPARTEMENTS:
      perimetre.type === "REGION_ET_SES_DEPARTEMENTS"
        ? ` en ${perimetre.region_code} et ses départements`
        : "",
    TOUTES_REGIONS: " dans toutes les régions",
    TOUS_DEPARTEMENTS: " dans tous les départements",
    FRANCE_ET_SES_REGIONS: " en France et dans ses régions",
    TOUS_TERRITOIRES: "",
  }[perimetre.type];
  return `${elements}${territoires}`;
}

function clarification(
  input: GetIndicateursACompleterInput,
): ClarifyWithChoicesOutput {
  const perimetre = libellePerimetreClarification(input);
  const choix = (libelle: string) => ({
    label: `${libelle}${perimetre}`,
    value: `${libelle}${perimetre}`,
  });
  return {
    question: `Quelles valeurs voulez-vous vérifier${perimetre} ?`,
    choices: [
      choix("Valeurs d'avancement non à jour"),
      choix("Valeurs initiales et cibles manquantes"),
      choix(
        "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes",
      ),
    ],
  };
}

function libellePerimetre({
  input,
  nomsDesTerritoires,
  territoireCodes,
  indicateurIds,
  chantiersAccessibles,
}: {
  input: GetIndicateursACompleterInput;
  nomsDesTerritoires: Map<string, string>;
  territoireCodes: string[];
  indicateurIds: string[] | undefined;
  chantiersAccessibles: string[];
}): string {
  const nomDuTerritoire = (code: string) =>
    nomsDesTerritoires.get(code) ?? code;
  const { perimetre } = input;
  const territoires =
    territoireCodes.length === 1
      ? nomDuTerritoire(territoireCodes[0])
      : libelleDesTerritoires();
  const indicateurs = [...new Set(indicateurIds)];
  const chantiers = [...new Set(input.chantier_ids)].filter((chantierId) =>
    chantiersAccessibles.includes(chantierId),
  );
  const elements = indicateurs.length > 0 ? indicateurs : chantiers;
  return [...elements, territoires].join(", ");

  function libelleDesTerritoires(): string {
    return {
      TOUS_TERRITOIRES: "tous vos territoires",
      TOUTES_REGIONS: "toutes vos régions",
      TOUS_DEPARTEMENTS: "tous vos départements",
      FRANCE_ET_SES_REGIONS: "France et ses régions",
      REGION_ET_SES_DEPARTEMENTS:
        perimetre.type === "REGION_ET_SES_DEPARTEMENTS"
          ? `${nomDuTerritoire(perimetre.region_code)} et ses départements`
          : "",
      SELECTION:
        perimetre.type === "SELECTION"
          ? perimetre.territoire_codes.map(nomDuTerritoire).join(", ")
          : "",
    }[perimetre.type];
  }
}

export function createGetIndicateursACompleterTool({
  getIndicateursNonAJourQuery,
  getIndicateursSansViVcQuery,
  getIndicateursIdentiteQuery,
  getTerritoiresIdentiteQuery,
  territoireResolver,
}: {
  getIndicateursNonAJourQuery: GetIndicateursNonAJourQuery;
  getIndicateursSansViVcQuery: GetIndicateursSansViVcQuery;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
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
      description: `Renvoie les indicateurs à compléter, par chantier, indicateur et maille, selon trois motifs :
- VA non à jour : sa date de prochaine mise à jour (date de la dernière valeur + périodicité + délai de disponibilité) est dépassée, ou aucune valeur n'a jamais été renseignée ;
- VI manquante : aucune valeur initiale n'est renseignée ; une valeur à 0 est renseignée ;
- VC manquante : aucune valeur cible n'est renseignée pour le jalon \`jalon_vc\`, le jalon en cours, qui prime sur celui de la session ; cite-le dès qu'une VC est en jeu, y compris si la demande vise une autre année : réponds sur ce jalon, sans clarifier ni rappeler l'outil.
Les nombres sont calculés par l'outil.
- \`motifs\` : les types de valeurs nommés ou établis par les échanges, sinon les trois, plusieurs dans un seul appel. L'outil demande lui-même la précision du type de valeurs : n'appelle jamais clarify_with_choices pour cela.
- \`precision_demandee\` : suis la \`consigne\` renvoyée.
- Rédaction :
  - cite le périmètre interrogé (\`perimetre\`) ;
  - présente les indicateurs, regroupés par chantier, motif par motif, avec le nombre de territoires par maille ;
  - ne somme jamais des territoires entre indicateurs, entre mailles ou entre motifs : un même territoire peut être concerné par plusieurs indicateurs. Si on te demande un total (par chantier, sur le périmètre), donne les nombres indicateur par indicateur et renvoie au tableau du détail ;
  - sur un seul territoire interrogé, ne donne aucun nombre de territoires : dis sur quels chantiers et indicateurs il a des valeurs à compléter, par motif ;
  - n'explique pas d'office chaque motif ; quand tu en définis un (« qu'est-ce que… », « pourquoi… »), reprends sa définition ci-dessus ;
  - \`sans_valeur_a_completer\` : dis que ces chantiers ou indicateurs n'ont aucune valeur à compléter sur ce périmètre, jamais qu'ils sont sans donnée ;
  - une maille à 0 : aucun territoire à compléter sur cette maille, jamais une donnée indisponible ;
  - quand il y a au moins un indicateur, termine par une phrase qui introduit le tableau du détail affiché sous la réponse ;
  - noms de territoires, dates, classement de territoires : tu ne les reçois pas, renvoie au tableau.
- Liste vide : c'est la réponse définitive. Ne rappelle jamais l'outil avec les mêmes arguments et ne demande pas de précision.
- ${CONSIGNE_ACCES_REFUSE}
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; dis-le une seule fois, n'en dis rien d'autre, et ne les présente jamais comme à jour ou complets.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme à jour ni comme à compléter.
- Un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- les chantiers en retard au sens de l'avancement (écart à la médiane) → get_chantiers (view "en_retard") ;
- les chantiers au taux d'avancement non calculé → get_chantiers_signales.`,
      inputSchema: getIndicateursACompleterInputSchema,
      execute: async (
        input: GetIndicateursACompleterInput,
        { messages }: { messages: ModelMessage[] },
      ): Promise<GetIndicateursACompleterOutput> => {
        const motifs = ordonnerMotifs(input.motifs);

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
          return acces.champsAcces;
        }

        if (doitDemanderPrecision({ messages })) {
          return { clarification: clarification(input), ...acces.champsAcces };
        }

        const jalon = getAnneeDateDeBascule(
          new Date(),
          configuration().dateBasculeAffichageValeursAnneePrecedente,
        );
        const filtres = {
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
        };
        const [lignesVa, lignesViVc, territoires] = await Promise.all([
          motifs.includes("va")
            ? getIndicateursNonAJourQuery.execute(filtres)
            : [],
          motifs.includes("vi") || motifs.includes("vc")
            ? getIndicateursSansViVcQuery.execute({
                ...filtres,
                jalon,
                valeurs: valeursRecherchees(motifs),
              })
            : [],
          getTerritoiresIdentiteQuery.execute(),
        ]);

        const jalonDeLaVc = motifs.includes("vc") ? jalon : undefined;
        const lignes = fusionnerLignes({ motifs, lignesVa, lignesViVc });
        const perimetre = libellePerimetre({
          input,
          nomsDesTerritoires: new Map(
            territoires.map(({ code, nom }) => [code, nom]),
          ),
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
          chantiersAccessibles,
        });
        const indicateursDemandes = acces.indicateurIds ?? [];
        const demandesExplicites =
          indicateursDemandes.length > 0
            ? indicateursDemandes
            : [...new Set(input.chantier_ids)].filter((chantierId) =>
                chantiersAccessibles.includes(chantierId),
              );

        return {
          resume: resumerIndicateursACompleter({
            lignes,
            motifs,
            mailles: maillesDesTerritoires({
              territoireCodes: acces.territoireCodes,
              territoires,
            }),
            perimetre,
            jalon: jalonDeLaVc,
            demandesExplicites,
          }),
          detail: {
            motifs,
            ...(jalonDeLaVc !== undefined && { jalon: jalonDeLaVc }),
            perimetre,
            lignes: lignes.map(versLigneACompleter),
          },
          ...acces.champsAcces,
        };
      },
      toModelOutput: indicateursACompleterVersModele,
    });
  };
}
