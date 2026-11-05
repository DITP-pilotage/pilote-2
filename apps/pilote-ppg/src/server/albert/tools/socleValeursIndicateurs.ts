import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  descriptionPerimetre,
  resoudrePerimetreAccessible,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

export const CONSIGNE_ACCES_REFUSE =
  "`acces_refuse` : l'utilisateur n'a accès ni à ces territoires, ni à aucun des chantiers ou indicateurs demandés.";

export const chantierIdsIndicateursSchema = chantierIdsSchema
  .optional()
  .default([])
  .describe(
    "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
  );

export const indicateurIdsSchema = z
  .array(z.string())
  .optional()
  .default([])
  .describe(
    "Identifiants d'indicateurs (ex: ['IND-894']). Si l'indicateur est décrit sans identifiant, résous-le d'abord avec search_indicateurs.",
  );

export const perimetreIndicateursSchema = z
  .discriminatedUnion("type", [
    variantesPerimetre.SELECTION,
    variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
    variantesPerimetre.FRANCE_ET_SES_REGIONS,
    variantesPerimetre.TOUTES_REGIONS,
    variantesPerimetre.TOUS_DEPARTEMENTS,
    variantesPerimetre.TOUS_TERRITOIRES,
  ])
  .optional()
  .default({ type: "TOUS_TERRITOIRES" })
  .describe(
    `${descriptionPerimetre({
      types: [
        "SELECTION",
        "REGION_ET_SES_DEPARTEMENTS",
        "FRANCE_ET_SES_REGIONS",
        "TOUTES_REGIONS",
        "TOUS_DEPARTEMENTS",
        "TOUS_TERRITOIRES",
      ],
    })}
Par défaut, TOUS_TERRITOIRES. N'y mets pas le territoire courant de la session, sauf si la demande le nomme.`,
  );

type ListesSignalees = {
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
  indicateurs_introuvables?: string[];
};

/** Les champs d'accès signalés au modèle, seulement quand ils s'appliquent. */
export type ChampsAcces = ListesSignalees & { acces_refuse?: true };

export type AccesResolus =
  | { statut: "sans_resultat"; champsAcces: ChampsAcces }
  | {
      statut: "interrogeable";
      champsAcces: ChampsAcces;
      chantierIds: string[];
      territoireCodes: string[];
      indicateurIds?: string[];
    };

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

export async function resoudreAccesIndicateurs({
  chantierIds: chantiersDemandesBruts,
  indicateurIds: indicateursDemandesBruts,
  perimetre,
  territoiresAccessibles,
  chantiersAccessibles,
  territoireResolver,
  getIndicateursIdentiteQuery,
}: {
  chantierIds: string[];
  indicateurIds: string[];
  perimetre: z.infer<typeof perimetreIndicateursSchema>;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
  territoireResolver: TerritoireResolver;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
}): Promise<AccesResolus> {
  const perimetreAccessible = await resoudrePerimetreAccessible({
    perimetre,
    territoiresAccessibles,
    territoireResolver,
  });
  const territoireCodes =
    "codes" in perimetreAccessible ? perimetreAccessible.codes : [];
  if (territoireCodes.length === 0) {
    return { statut: "sans_resultat", champsAcces: { acces_refuse: true } };
  }

  const chantiersDemandes = [...new Set(chantiersDemandesBruts)];
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
      statut: "sans_resultat",
      champsAcces: {
        acces_refuse: true,
        ...listesSignalees({ chantiersNonAccessibles }),
      },
    };
  }

  const indicateursDemandes = [...new Set(indicateursDemandesBruts)];
  if (indicateursDemandes.length === 0) {
    return {
      statut: "interrogeable",
      champsAcces: listesSignalees({ chantiersNonAccessibles }),
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
      statut: "sans_resultat",
      champsAcces: {
        ...(indicateursNonAccessibles.length > 0 && {
          acces_refuse: true as const,
        }),
        ...listes,
      },
    };
  }

  return {
    statut: "interrogeable",
    champsAcces: listes,
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
