import type { $Enums } from "@prisma/client";
import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  descriptionPerimetre,
  resoudrePerimetreAccessible,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

export const SEUIL_LIGNES_TERRITOIRES = 800;
export const MAILLES_ORDER: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

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

/** Les listes signalées au modèle, seulement quand elles ne sont pas vides. */
export type ListesSignalees = {
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
  indicateurs_introuvables?: string[];
};

export type AccesResolus =
  | { statut: "refuse"; listes: ListesSignalees }
  | { statut: "rien_a_interroger"; listes: ListesSignalees }
  | {
      statut: "interrogeable";
      listes: ListesSignalees;
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
    return { statut: "refuse", listes: {} };
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
      statut: "refuse",
      listes: listesSignalees({ chantiersNonAccessibles }),
    };
  }

  const indicateursDemandes = [...new Set(indicateursDemandesBruts)];
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
