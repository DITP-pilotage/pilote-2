export type TerritoireCompte = {
  code: string;
  nom: string;
  maille: "DEPT" | "REG" | "NAT";
  enfants: TerritoireCompte[];
};

export type CompteActivite = {
  email: string;
  nom: string;
  prenom: string;
  profil: string;
  territoires: TerritoireCompte[];
};

export type EvenementCompte =
  | {
      type: "COMPTE_CREE";
      compte: CompteActivite;
      date: Date;
    }
  | {
      type: "COMPTE_DESACTIVE";
      compte: CompteActivite;
      date: Date;
    };

export type ActiviteComptes = readonly EvenementCompte[];

export function grouperEvenementsParType(activite: ActiviteComptes): {
  comptesCrees: CompteActivite[];
  comptesDesactives: CompteActivite[];
} {
  return {
    comptesCrees: activite
      .filter(
        (e): e is Extract<EvenementCompte, { type: "COMPTE_CREE" }> =>
          e.type === "COMPTE_CREE",
      )
      .map((e) => e.compte),
    comptesDesactives: activite
      .filter(
        (e): e is Extract<EvenementCompte, { type: "COMPTE_DESACTIVE" }> =>
          e.type === "COMPTE_DESACTIVE",
      )
      .map((e) => e.compte),
  };
}
