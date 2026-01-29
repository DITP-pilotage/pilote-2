export type TypeEvenementVA =
  | "VALEUR_CREEE"
  | "VALEUR_MODIFIEE"
  | "VALEUR_HISTORISEE";

export type EvenementVA = {
  id: string;
  indicateurId: string;
  indicateurNom: string;
  territoireCode: string;
  territoireNom: string;
  typeEvenement: TypeEvenementVA;
  dateValeur: Date;
  valeur: number | null;
  dateCreation: Date;
  ordre: number;
};

export type ActiviteIndicateurVA = {
  indicateurId: string;
  indicateurNom: string;
  territoireCode: string;
  territoireNom: string;
  valeurAvant: number | null;
  valeurApres: number | null;
  dateChangement: Date;
};

export type IndicateurInfo = {
  id: string;
  nom: string;
};

export type ChantierInfo = {
  id: string;
  nom: string;
};

export type TerritoireInfo = {
  code: string;
  nom: string;
};

export type SectionTerritoireVA = {
  territoire: TerritoireInfo;
  valeurAvant: number | null;
  valeurApres: number | null;
  dateChangement: Date;
};

export type SectionIndicateurVA = {
  indicateur: IndicateurInfo;
  territoires: SectionTerritoireVA[];
};

export type SectionChantierVA = {
  chantier: ChantierInfo;
  indicateurs: SectionIndicateurVA[];
};

export type SectionActiviteChantiersVA = {
  chantiers: SectionChantierVA[];
};

function grouperParIndicateurTerritoire(
  evenements: EvenementVA[],
): Map<string, EvenementVA[]> {
  const grouped = new Map<string, EvenementVA[]>();

  for (const evenement of evenements) {
    const key = `${evenement.indicateurId}|${evenement.territoireCode}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(evenement);
  }

  return grouped;
}

/**
 * Fold multiple VA events into a single ActiviteIndicateurVA per indicateur/territoire pair.
 *
 * Rules:
 * - Multiple events on same indic/territoire = single result
 * - valeurAvant = last value BEFORE period start (from historical events)
 * - valeurApres = value from last event in period
 * - dateChangement = date of last event in period
 */
export function foldEvenementsVA(params: {
  evenementsDansPeriode: EvenementVA[];
  evenementsAvantPeriode: EvenementVA[];
}): ActiviteIndicateurVA[] {
  const { evenementsDansPeriode, evenementsAvantPeriode } = params;

  const groupedDansPeriode = grouperParIndicateurTerritoire(
    evenementsDansPeriode,
  );
  const groupedAvantPeriode = grouperParIndicateurTerritoire(
    evenementsAvantPeriode,
  );

  const resultats: ActiviteIndicateurVA[] = [];

  for (const [key, evenements] of groupedDansPeriode.entries()) {
    const sorted = [...evenements].sort((a, b) => {
      const dateCompare = b.dateCreation.getTime() - a.dateCreation.getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.ordre - a.ordre;
    });

    const dernierEvenement = sorted[0];

    const evenementsAvant = groupedAvantPeriode.get(key) || [];
    const sortedAvant = [...evenementsAvant].sort((a, b) => {
      const dateCompare = b.dateCreation.getTime() - a.dateCreation.getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.ordre - a.ordre;
    });
    const valeurAvant = sortedAvant.length > 0 ? sortedAvant[0].valeur : null;

    resultats.push({
      indicateurId: dernierEvenement.indicateurId,
      indicateurNom: dernierEvenement.indicateurNom,
      territoireCode: dernierEvenement.territoireCode,
      territoireNom: dernierEvenement.territoireNom,
      valeurAvant,
      valeurApres: dernierEvenement.valeur,
      dateChangement: dernierEvenement.dateCreation,
    });
  }

  return resultats;
}
