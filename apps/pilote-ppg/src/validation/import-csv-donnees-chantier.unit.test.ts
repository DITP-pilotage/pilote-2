import {
  LigneRepartieCommentaire,
  LigneRepartieDecisionStrategique,
  LigneRepartieObjectif,
  LigneRepartieSyntheseDesResultats,
  ligneCSVDonneesChantierSchema,
  résoudreDomaineCible,
  répartirLigne,
  validerLignesCSV,
} from "@/validation/import-csv-donnees-chantier";

function ligneCSVBrute(overrides: Partial<Record<string, string>> = {}) {
  return {
    chantier_id: "CH-001",
    type: "commentaires_sur_les_donnees",
    contenu: "Un commentaire",
    date: "2026-01-15",
    auteur_email: "auteur@example.com",
    maille: "REG",
    code_insee: "11",
    meteo: "",
    ...overrides,
  };
}

function ligneCSV(overrides: Partial<Record<string, string>> = {}) {
  return ligneCSVDonneesChantierSchema.parse(ligneCSVBrute(overrides));
}

describe("résoudreDomaineCible", () => {
  it("résout les types de commentaires (codes du contrat API) vers le domaine commentaire", () => {
    expect(résoudreDomaineCible("commentaires_sur_les_donnees")).toEqual(
      "commentaire",
    );
    expect(résoudreDomaineCible("autres_resultats_obtenus")).toEqual(
      "commentaire",
    );
    expect(
      résoudreDomaineCible(
        "autres_resultats_obtenus_non_correles_aux_indicateurs",
      ),
    ).toEqual("commentaire");
    expect(résoudreDomaineCible("risques_et_freins_a_lever")).toEqual(
      "commentaire",
    );
    expect(résoudreDomaineCible("solutions_et_actions_a_venir")).toEqual(
      "commentaire",
    );
    expect(résoudreDomaineCible("exemples_concrets_de_reussite")).toEqual(
      "commentaire",
    );
  });

  it("résout synthese_des_resultats vers le domaine synthese_des_resultats", () => {
    expect(résoudreDomaineCible("synthese_des_resultats")).toEqual(
      "synthese_des_resultats",
    );
  });

  it("résout suivi_des_decisions vers le domaine decision_strategique", () => {
    expect(résoudreDomaineCible("suivi_des_decisions")).toEqual(
      "decision_strategique",
    );
  });

  it("résout les types d'objectifs vers le domaine objectif", () => {
    expect(résoudreDomaineCible("notre_ambition")).toEqual("objectif");
    expect(résoudreDomaineCible("deja_fait")).toEqual("objectif");
    expect(résoudreDomaineCible("a_faire")).toEqual("objectif");
  });

  it("retourne null pour un type inconnu", () => {
    expect(résoudreDomaineCible("type_inexistant")).toBeNull();
  });
});

describe("validerLignesCSV", () => {
  it("accepte une ligne valide", () => {
    const { lignesValides, erreurs } = validerLignesCSV([ligneCSVBrute()]);

    expect(erreurs).toEqual([]);
    expect(lignesValides).toEqual([
      {
        chantier_id: "CH-001",
        type: "commentaires_sur_les_donnees",
        contenu: "Un commentaire",
        date: "2026-01-15",
        auteur_email: "auteur@example.com",
        maille: "REG",
        code_insee: "11",
      },
    ]);
  });

  it("rejette une ligne avec un type inconnu", () => {
    const { lignesValides, erreurs } = validerLignesCSV([
      ligneCSVBrute({ type: "type_inexistant" }),
    ]);

    expect(lignesValides).toEqual([]);
    expect(erreurs).toEqual([
      expect.objectContaining({
        ligne: 0,
        chantierId: "CH-001",
        type: "type_inexistant",
      }),
    ]);
  });

  it("rejette une ligne avec un chantier_id vide", () => {
    const { erreurs } = validerLignesCSV([ligneCSVBrute({ chantier_id: "" })]);

    expect(erreurs).toHaveLength(1);
  });

  it("rejette une ligne avec une date dans le futur", () => {
    const { erreurs } = validerLignesCSV([
      ligneCSVBrute({ date: "2099-01-01" }),
    ]);

    expect(erreurs).toHaveLength(1);
  });

  it("rejette une ligne avec un contenu trop long", () => {
    const { erreurs } = validerLignesCSV([
      ligneCSVBrute({ contenu: "a".repeat(10001) }),
    ]);

    expect(erreurs).toHaveLength(1);
  });

  it("continue de valider les lignes suivantes après une ligne invalide", () => {
    const { lignesValides, erreurs } = validerLignesCSV([
      ligneCSVBrute({ chantier_id: "" }),
      ligneCSVBrute(),
    ]);

    expect(erreurs).toHaveLength(1);
    expect(lignesValides).toHaveLength(1);
  });
});

describe("répartirLigne", () => {
  it("construit une ligne commentaire avec le type du CSV inchangé (code du contrat API)", () => {
    const ligne = répartirLigne(
      ligneCSV({ type: "risques_et_freins_a_lever" }),
    ) as LigneRepartieCommentaire;

    expect(ligne.domaine).toEqual("commentaire");
    expect(ligne.chantierId).toEqual("CH-001");
    expect(ligne.input).toEqual({
      territoire: "REG-11",
      type: "risques_et_freins_a_lever",
      contenu: "Un commentaire",
      date_commentaire: "2026-01-15",
    });
  });

  it("construit le territoire national par défaut si maille/code_insee sont vides", () => {
    const ligne = répartirLigne(
      ligneCSV({ maille: "", code_insee: "" }),
    ) as LigneRepartieCommentaire;

    expect(ligne.input.territoire).toEqual("NAT-FR");
  });

  it("construit une ligne synthese_des_resultats avec météo NON_RENSEIGNEE si absente", () => {
    const ligne = répartirLigne(
      ligneCSV({
        type: "synthese_des_resultats",
        meteo: "",
      }),
    ) as LigneRepartieSyntheseDesResultats;

    expect(ligne.domaine).toEqual("synthese_des_resultats");
    expect(ligne.input.meteo).toEqual("NON_RENSEIGNEE");
  });

  it("construit une ligne synthese_des_resultats avec la météo fournie", () => {
    const ligne = répartirLigne(
      ligneCSV({
        type: "synthese_des_resultats",
        meteo: "SOLEIL",
      }),
    ) as LigneRepartieSyntheseDesResultats;

    expect(ligne.input.meteo).toEqual("SOLEIL");
  });

  it("construit une ligne decision_strategique", () => {
    const ligne = répartirLigne(
      ligneCSV({ type: "suivi_des_decisions" }),
    ) as LigneRepartieDecisionStrategique;

    expect(ligne.domaine).toEqual("decision_strategique");
    expect(ligne.input).toEqual({
      type: "suivi_des_decisions",
      contenu: "Un commentaire",
      date_decision_strategique: "2026-01-15",
    });
  });

  it("construit une ligne objectif", () => {
    const ligne = répartirLigne(
      ligneCSV({ type: "notre_ambition" }),
    ) as LigneRepartieObjectif;

    expect(ligne.domaine).toEqual("objectif");
    expect(ligne.input).toEqual({
      type: "notre_ambition",
      contenu: "Un commentaire",
      date_objectif: "2026-01-15",
    });
  });
});
