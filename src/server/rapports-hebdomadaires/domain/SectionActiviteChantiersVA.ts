export type TypeEvenementVA =
  | "VALEUR_CREEE"
  | "VALEUR_MODIFIEE"
  | "VALEUR_HISTORISEE";

export type EvenementVA = {
  id: string;
  indicateur: {
    id: string;
    nom: string;
  };
  territoire: {
    code: string;
    nom: string;
  };
  typeEvenement: TypeEvenementVA;
  dateValeur: Date;
  valeur: number | null;
  dateCreation: Date;
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
  valeurAvancement: number | null;
  dateValeur: Date;
};

export type SectionTerritoire = {
  code: string;
  nom: string;
  valeurAvancement: number | null;
  dateValeur: string;
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
  evenements: EvenementVA[],
): ActiviteIndicateur[] {
  const grouped = new Map<string, EvenementVA[]>();

  for (const evenement of evenements) {
    const key = `${evenement.indicateur.id}|${evenement.territoire.code}|${evenement.dateValeur.toISOString()}`;
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
      valeurAvancement: dernierEvenement.valeur,
      dateValeur: dernierEvenement.dateValeur,
    });
  }

  return resultats;
}
