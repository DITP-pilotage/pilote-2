import type {
  GetIndicateurContexteQuery,
  IndicateurContexteResult,
} from "@/server/chantiers/query/GetIndicateurContexteQuery";

export type IndicateursScope =
  | { accesRefuse: true }
  | {
      accesRefuse: false;
      chantierIds: string[];
      territoireCodes: string[];
      indicateurIds?: string[];
      withTerritoiresDetail: boolean;
      chantiersNonAccessibles: string[];
      indicateursNonAccessibles: string[];
    };

function indicateursInaccessibles(
  contextes: (IndicateurContexteResult | null)[],
  chantiersAccessibles: string[],
): string[] {
  return contextes.flatMap((contexte) =>
    contexte && !chantiersAccessibles.includes(contexte.chantier.id)
      ? [contexte.id]
      : [],
  );
}

/**
 * Le périmètre interrogé par les outils d'indicateurs à partir des chantiers,
 * indicateurs et territoire demandés, borné aux accès de l'utilisateur.
 */
export async function resolveIndicateursScope({
  input,
  territoiresAccessibles,
  chantiersAccessibles,
  getIndicateurContexteQuery,
}: {
  input: {
    chantier_ids: string[];
    indicateur_ids: string[];
    territoire_code?: string;
  };
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
}): Promise<IndicateursScope> {
  if (
    input.territoire_code &&
    !territoiresAccessibles.includes(input.territoire_code)
  ) {
    return { accesRefuse: true };
  }

  if (!input.territoire_code && territoiresAccessibles.length === 0) {
    return { accesRefuse: true };
  }

  const chantiersDemandes = input.chantier_ids.length > 0;
  const chantiersNonAccessibles = input.chantier_ids.filter(
    (chantierId) => !chantiersAccessibles.includes(chantierId),
  );
  const chantierIds = chantiersDemandes
    ? input.chantier_ids.filter(
        (chantierId) => !chantiersNonAccessibles.includes(chantierId),
      )
    : chantiersAccessibles;

  if (chantierIds.length === 0) {
    return { accesRefuse: true };
  }

  const indicateursDemandes = input.indicateur_ids.length > 0;
  const contextesIndicateurs = await Promise.all(
    input.indicateur_ids.map((indicateurId) =>
      getIndicateurContexteQuery.execute({ indicateurId }),
    ),
  );
  const indicateursNonAccessibles = indicateursInaccessibles(
    contextesIndicateurs,
    chantiersAccessibles,
  );
  const indicateurIds = input.indicateur_ids.filter(
    (indicateurId) => !indicateursNonAccessibles.includes(indicateurId),
  );

  if (indicateursDemandes && indicateurIds.length === 0) {
    return { accesRefuse: true };
  }

  return {
    accesRefuse: false,
    chantierIds,
    territoireCodes: input.territoire_code
      ? [input.territoire_code]
      : territoiresAccessibles,
    indicateurIds: indicateursDemandes ? indicateurIds : undefined,
    withTerritoiresDetail:
      indicateursDemandes || Boolean(input.territoire_code),
    chantiersNonAccessibles,
    indicateursNonAccessibles,
  };
}

export function scopeAccessFields(
  scope: Extract<IndicateursScope, { accesRefuse: false }>,
): {
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
} {
  return {
    ...(scope.chantiersNonAccessibles.length > 0 && {
      chantiers_non_accessibles: scope.chantiersNonAccessibles,
    }),
    ...(scope.indicateursNonAccessibles.length > 0 && {
      indicateurs_non_accessibles: scope.indicateursNonAccessibles,
    }),
  };
}
