export type TypeValeurIndicateur =
  | "VALEUR_AVANCEMENT"
  | "VALEUR_INITIALE"
  | "VALEUR_CIBLE";

export type EvenementIndicateur = {
  id: string;
  indicateur: {
    id: string;
    nom: string;
  };
  territoire: {
    code: string;
    nom: string;
  };
  typeValeur: TypeValeurIndicateur;
  dateValeur: Date;
  valeur: number | null;
  dateCreation: Date;
  // TODO : is it required ?
  ordre: number;
};

export type ActiviteIndicateur = {
  indicateur: {
    id: string;
    nom: string;
  };
  territoire: {
    code: string;
    nom: string;
  };
  typeValeur: TypeValeurIndicateur;
  valeur: number | null;
  dateValeur: Date;
  dateEvenement: Date;
};

export type SectionTerritoire = {
  code: string;
  nom: string;
  typeValeur: TypeValeurIndicateur;
  valeur: number | null;
  dateValeur: string;
  dateEvenement: string;
};

export type SectionIndicateur = {
  id: string;
  nom: string;
  territoires: SectionTerritoire[];
};

export type SectionChantier = {
  id: string;
  nom: string;
  indicateurs: SectionIndicateur[];
};

export function grouperEvenements(
  evenements: EvenementIndicateur[],
): ActiviteIndicateur[] {
  const grouped = new Map<string, EvenementIndicateur[]>();

  for (const evenement of evenements) {
    const key = `${evenement.indicateur.id}|${evenement.territoire.code}|${evenement.typeValeur}|${evenement.dateValeur.toISOString()}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(evenement);
  }

  const resultats: ActiviteIndicateur[] = [];

  for (const [, evenementsGroupe] of grouped.entries()) {
    const sorted = [...evenementsGroupe].sort((a, b) => {
      const dateCompare = b.dateCreation.getTime() - a.dateCreation.getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.ordre - a.ordre;
    });

    const dernierEvenement = sorted[0];

    resultats.push({
      indicateur: {
        id: dernierEvenement.indicateur.id,
        nom: dernierEvenement.indicateur.nom,
      },
      territoire: {
        code: dernierEvenement.territoire.code,
        nom: dernierEvenement.territoire.nom,
      },
      typeValeur: dernierEvenement.typeValeur,
      valeur: dernierEvenement.valeur,
      dateValeur: dernierEvenement.dateValeur,
      dateEvenement: dernierEvenement.dateCreation,
    });
  }

  return resultats.sort((a, b) => {
    const territoireCompare = a.territoire.code.localeCompare(
      b.territoire.code,
    );
    if (territoireCompare !== 0) return territoireCompare;
    const dateValeurCompare = b.dateValeur.getTime() - a.dateValeur.getTime();
    if (dateValeurCompare !== 0) return dateValeurCompare;
    return b.dateEvenement.getTime() - a.dateEvenement.getTime();
  });
}
