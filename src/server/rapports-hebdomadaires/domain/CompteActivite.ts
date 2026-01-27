export type CompteActivite = {
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly profil: string;
  readonly territoires: readonly {
    readonly code: string;
    readonly nom: string;
  }[];
};

export type EvenementCompte =
  | {
      readonly type: "COMPTE_CREE";
      readonly compte: CompteActivite;
      readonly date: Date;
    }
  | {
      readonly type: "COMPTE_DESACTIVE";
      readonly compte: CompteActivite;
      readonly date: Date;
    };

export type ActiviteComptes = readonly EvenementCompte[];

export function grouperEvenementsParType(activite: ActiviteComptes): {
  comptesCrees: readonly CompteActivite[];
  comptesDesactives: readonly CompteActivite[];
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
