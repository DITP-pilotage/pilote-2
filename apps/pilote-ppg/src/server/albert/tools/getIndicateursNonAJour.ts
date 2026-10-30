import { tool } from "ai";
import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import { libelleMaille } from "@/server/albert/tools/libelles";
import type {
  ChantierIndicateursNonAJour,
  GetIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  descriptionPerimetre,
  resoudrePerimetreAccessible,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

export const getIndicateursNonAJourInputSchema = z.object({
  chantier_ids: chantierIdsSchema
    .optional()
    .default([])
    .describe(
      "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
    ),
  indicateur_ids: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      "Identifiants d'indicateurs (ex: ['IND-894']). Si l'indicateur est décrit sans identifiant, résous-le d'abord avec search_indicateurs.",
    ),
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION,
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
      variantesPerimetre.TOUTES_REGIONS,
      variantesPerimetre.TOUS_DEPARTEMENTS,
    ])
    .optional()
    .describe(
      `${descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
          "TOUTES_REGIONS",
          "TOUS_DEPARTEMENTS",
        ],
      })}
Absent = tous les territoires accessibles à l'utilisateur. N'y mets pas le territoire courant de la session, sauf si la demande le nomme.`,
    ),
  detail: z
    .enum(["compteurs", "territoires"])
    .optional()
    .default("compteurs")
    .describe(
      "compteurs : par chantier, indicateur et maille, le nombre de territoires en retard. territoires : en plus, chaque territoire en retard avec ses dates. Choisis territoires seulement quand la demande nomme les territoires ou le détail (« sur quels territoires », « les départements non à jour », « le détail par territoire »).",
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
  nb_territoires_applicables: number;
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

export type GetIndicateursNonAJourOutput = {
  detail: GetIndicateursNonAJourInput["detail"];
  resultats: ChantierNonAJourRenvoye[];
  acces_refuse?: true;
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
  indicateurs_introuvables?: string[];
};

/** Les listes signalées au modèle, seulement quand elles ne sont pas vides. */
type ListesSignalees = Pick<
  GetIndicateursNonAJourOutput,
  | "chantiers_non_accessibles"
  | "indicateurs_non_accessibles"
  | "indicateurs_introuvables"
>;

type AccesResolus =
  | { statut: "refuse"; listes: ListesSignalees }
  | { statut: "rien_a_interroger"; listes: ListesSignalees }
  | {
      statut: "interrogeable";
      listes: ListesSignalees;
      chantierIds: string[];
      territoireCodes: string[];
      indicateurIds?: string[];
    };

function renvoyerChantierNonAJour({
  chantier,
  indicateurs,
}: ChantierIndicateursNonAJour): ChantierNonAJourRenvoye {
  return {
    chantier,
    indicateurs: indicateurs.map((indicateur) => ({
      id: indicateur.id,
      nom: indicateur.nom,
      periodicite: indicateur.periodicite,
      delai_disponibilite_mois: indicateur.delaiDisponibiliteMois,
      mailles: indicateur.mailles.map((maille) => ({
        maille: libelleMaille({ maille: maille.maille }),
        nb_territoires_en_retard: maille.nbTerritoiresEnRetard,
        nb_territoires_applicables: maille.nbTerritoiresApplicables,
        ...(maille.territoiresEnRetard && {
          territoires_en_retard: maille.territoiresEnRetard.map(
            (territoire) => ({
              code: territoire.code,
              nom: territoire.nom,
              date_derniere_valeur: territoire.dateDerniereValeur,
              mise_a_jour_attendue_depuis: territoire.miseAJourAttendueDepuis,
            }),
          ),
        }),
      })),
    })),
  };
}

function listesSignalees({
  chantiersNonAccessibles = [],
  indicateursNonAccessibles = [],
  indicateursIntrouvables = [],
}: {
  chantiersNonAccessibles?: string[];
  indicateursNonAccessibles?: string[];
  indicateursIntrouvables?: string[];
}): ListesSignalees {
  return {
    ...(chantiersNonAccessibles.length > 0 && {
      chantiers_non_accessibles: chantiersNonAccessibles,
    }),
    ...(indicateursNonAccessibles.length > 0 && {
      indicateurs_non_accessibles: indicateursNonAccessibles,
    }),
    ...(indicateursIntrouvables.length > 0 && {
      indicateurs_introuvables: indicateursIntrouvables,
    }),
  };
}

async function resoudreTerritoires({
  perimetre,
  territoiresAccessibles,
  territoireResolver,
}: {
  perimetre: GetIndicateursNonAJourInput["perimetre"];
  territoiresAccessibles: string[];
  territoireResolver: TerritoireResolver;
}): Promise<string[]> {
  if (!perimetre) {
    return territoiresAccessibles;
  }
  const perimetreAccessible = await resoudrePerimetreAccessible({
    perimetre,
    territoiresAccessibles,
    territoireResolver,
  });
  return "codes" in perimetreAccessible ? perimetreAccessible.codes : [];
}

async function resoudreAcces({
  input,
  territoiresAccessibles,
  chantiersAccessibles,
  territoireResolver,
  getIndicateursIdentiteQuery,
}: {
  input: GetIndicateursNonAJourInput;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
  territoireResolver: TerritoireResolver;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
}): Promise<AccesResolus> {
  const territoireCodes = await resoudreTerritoires({
    perimetre: input.perimetre,
    territoiresAccessibles,
    territoireResolver,
  });
  if (territoireCodes.length === 0) {
    return { statut: "refuse", listes: {} };
  }

  const chantiersDemandes = [...new Set(input.chantier_ids)];
  const chantiersNonAccessibles = chantiersDemandes.filter(
    (chantierId) => !chantiersAccessibles.includes(chantierId),
  );
  const chantierIds =
    chantiersDemandes.length > 0
      ? chantiersDemandes.filter(
          (chantierId) => !chantiersNonAccessibles.includes(chantierId),
        )
      : chantiersAccessibles;
  if (chantierIds.length === 0) {
    return {
      statut: "refuse",
      listes: listesSignalees({ chantiersNonAccessibles }),
    };
  }

  const indicateursDemandes = [...new Set(input.indicateur_ids)];
  if (indicateursDemandes.length === 0) {
    return {
      statut: "interrogeable",
      listes: listesSignalees({ chantiersNonAccessibles }),
      chantierIds,
      territoireCodes,
    };
  }

  const identites = await getIndicateursIdentiteQuery.execute({
    indicateurIds: indicateursDemandes,
  });
  const chantierParIndicateur = new Map(
    identites.map((identite) => [identite.id, identite.chantier.id]),
  );
  const indicateursIntrouvables = indicateursDemandes.filter(
    (indicateurId) => !chantierParIndicateur.has(indicateurId),
  );
  const indicateursNonAccessibles = indicateursDemandes.filter(
    (indicateurId) => {
      const chantierId = chantierParIndicateur.get(indicateurId);
      return chantierId && !chantiersAccessibles.includes(chantierId);
    },
  );
  const indicateurIds = indicateursDemandes.filter(
    (indicateurId) =>
      !indicateursIntrouvables.includes(indicateurId) &&
      !indicateursNonAccessibles.includes(indicateurId),
  );
  const listes = listesSignalees({
    chantiersNonAccessibles,
    indicateursNonAccessibles,
    indicateursIntrouvables,
  });

  if (indicateurIds.length === 0) {
    return {
      statut:
        indicateursNonAccessibles.length > 0 ? "refuse" : "rien_a_interroger",
      listes,
    };
  }

  return {
    statut: "interrogeable",
    listes,
    // Un indicateur nommé prime sur le filtre de chantiers : les deux filtres
    // s'appliquant en ET, il disparaîtrait sinon en silence.
    chantierIds: [
      ...new Set([
        ...chantierIds,
        ...indicateurIds.flatMap(
          (indicateurId) => chantierParIndicateur.get(indicateurId) ?? [],
        ),
      ]),
    ],
    territoireCodes,
    indicateurIds,
  };
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
      description: `Renvoie les indicateurs dont les données ne sont pas à jour, par chantier, indicateur et maille, avec le nombre de territoires en retard de mise à jour. Une donnée n'est pas à jour quand sa date théorique de mise à jour (date de la dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur s'applique.
- \`detail\` : "compteurs" (défaut) pour une question vague (« quels chantiers ont des indicateurs à mettre à jour ? », « quels sont les indicateurs non à jour ? ») ; "territoires" quand la demande nomme les territoires ou le détail (« sur quels territoires le CH-018 a des indicateurs non à jour ? », « donne les départements non à jour pour l'IND-894 », « … et affiche le détail par territoire »).
- Après des compteurs, propose à l'utilisateur le détail territoire par territoire sur un sous-ensemble (un chantier, un indicateur ou un territoire), sans le faire d'office.
- \`perimetre\` restreint les territoires considérés, dans les deux modes ; il ne déclenche pas le détail.
- Une région seule (« en Bretagne ») est une SELECTION de son seul code ; ses départements n'en font partie que si la demande les cite.
- Liste vide : aucun indicateur non à jour trouvé sur ce périmètre, ce qui ne prouve pas que les données sont à jour (l'indicateur peut ne pas être suivi ici).
- \`date_derniere_valeur\` null : aucune valeur n'a jamais été renseignée sur ce territoire.
- \`mise_a_jour_attendue_depuis\` null alors que \`date_derniere_valeur\` est renseignée : la date théorique n'a pas pu être calculée.
- \`acces_refuse\` : l'utilisateur n'a accès ni à ces territoires, ni à aucun des chantiers ou indicateurs demandés.
- \`chantiers_non_accessibles\`, \`indicateurs_non_accessibles\` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme à jour.
- \`indicateurs_introuvables\` : l'identifiant n'existe pas ou n'est pas publié ; dis-le, et ne le présente ni comme à jour ni comme non à jour.
Utilise-le pour : « indicateurs non à jour », « retard de mise à jour », « données périmées », « territoires qui n'ont pas mis à jour l'indicateur X » ; un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour : les chantiers en retard au sens de l'avancement (écart à la médiane) → get_chantiers (view "en_retard").`,
      inputSchema: getIndicateursNonAJourInputSchema,
      execute: async (
        input: GetIndicateursNonAJourInput,
      ): Promise<GetIndicateursNonAJourOutput> => {
        const acces = await resoudreAcces({
          input,
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

        const resultats = await getIndicateursNonAJourQuery.execute({
          chantierIds: acces.chantierIds,
          territoireCodes: acces.territoireCodes,
          indicateurIds: acces.indicateurIds,
          avecDetailTerritoires: input.detail === "territoires",
        });

        return {
          detail: input.detail,
          resultats: resultats.map(renvoyerChantierNonAJour),
          ...acces.listes,
        };
      },
    });
  };
}
