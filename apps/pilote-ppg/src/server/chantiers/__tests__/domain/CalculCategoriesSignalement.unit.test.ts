import { describe, expect, test } from "vitest";
import {
  categoriesApplicables,
  categoriesDuChantier,
  libelleCategorieSignalement,
  nomCategorie,
  type ChantierTerritoireAvecJalon,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";

const chantierBase: ChantierTerritoireAvecJalon = {
  id: "CH-001",
  meteo: "SOLEIL",
  tendance: "HAUSSE",
  nombre_propositions_valeur_actuelle: 0,
  chantier_identite: { cible_attendue: false },
  chantier_territoire_jalon: [{ ecart: 0, taux_avancement: 50 }],
};

describe("categoriesApplicables", () => {
  test("retourne les catégories nationales pour la maille NAT", () => {
    expect(categoriesApplicables("NAT")).toEqual([
      "taux_avancement_non_calcule",
      "absence_taux_avancement_departemental",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });

  test("retourne les catégories territoriales pour la maille REG", () => {
    expect(categoriesApplicables("REG")).toEqual([
      "retard_mediane",
      "tendance_baisse",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });

  test("retourne les catégories territoriales pour la maille DEPT", () => {
    expect(categoriesApplicables("DEPT")).toEqual([
      "retard_mediane",
      "tendance_baisse",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });
});

describe("nomCategorie", () => {
  test("retourne le nom générique de chaque catégorie", () => {
    expect(nomCategorie("retard_mediane")).toBe(
      "Retard par rapport à la médiane",
    );
    expect(nomCategorie("proposition_valeur_avancement")).toBe(
      "Proposition de valeur d'avancement",
    );
  });
});

describe("libelleCategorieSignalement", () => {
  test("insère l'adjectif régional pour retard_mediane en maille REG", () => {
    expect(libelleCategorieSignalement("retard_mediane", "REG")).toBe(
      "Chantier(s) avec un retard de 10 points par rapport à leur médiane régionale",
    );
  });

  test("insère l'adjectif départemental pour retard_mediane en maille DEPT", () => {
    expect(libelleCategorieSignalement("retard_mediane", "DEPT")).toBe(
      "Chantier(s) avec un retard de 10 points par rapport à leur médiane départementale",
    );
  });

  test("retourne le libellé fixe pour tendance_baisse quelle que soit la maille", () => {
    expect(libelleCategorieSignalement("tendance_baisse", "REG")).toBe(
      "Chantier(s) avec tendance en baisse",
    );
  });
});

describe("categoriesDuChantier", () => {
  test("aucune catégorie pour un chantier sans anomalie", () => {
    const categories = categoriesDuChantier(
      chantierBase,
      "DEPT",
      new Set(),
      new Set(),
    );
    expect(categories).toEqual([]);
  });

  test("retard_mediane quand ecart < -10 strictement, en maille DEPT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_territoire_jalon: [{ ecart: -11, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([
      "retard_mediane",
    ]);
  });

  test("pas de retard_mediane quand ecart vaut exactement -10 (seuil strict)", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_territoire_jalon: [{ ecart: -10, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([]);
  });

  test("retard_mediane et tendance_baisse ne s'appliquent jamais en maille NAT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      tendance: "BAISSE",
      chantier_territoire_jalon: [{ ecart: -20, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "NAT", new Set(), new Set())).toEqual([]);
  });

  test("taux_avancement_non_calcule et absence_taux_avancement_departemental ne s'appliquent qu'au NAT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_identite: { cible_attendue: true },
      chantier_territoire_jalon: [{ ecart: 0, taux_avancement: null }],
    };
    expect(
      categoriesDuChantier(chantier, "DEPT", new Set(), new Set(["CH-001"])),
    ).toEqual([]);
    expect(
      categoriesDuChantier(chantier, "NAT", new Set(), new Set(["CH-001"])),
    ).toEqual([
      "taux_avancement_non_calcule",
      "absence_taux_avancement_departemental",
    ]);
  });

  test("meteo_synthese_non_renseignees pour meteo null ou NON_RENSEIGNEE, à toute maille", () => {
    const chantierNull: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      meteo: null,
    };
    const chantierNonRenseignee: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      meteo: "NON_RENSEIGNEE",
    };
    expect(categoriesDuChantier(chantierNull, "DEPT", new Set(), new Set())).toEqual([
      "meteo_synthese_non_renseignees",
    ]);
    expect(
      categoriesDuChantier(chantierNonRenseignee, "NAT", new Set(), new Set()),
    ).toEqual(["meteo_synthese_non_renseignees"]);
  });

  test("proposition_valeur_avancement en DEPT utilise le compteur direct du chantier", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      nombre_propositions_valeur_actuelle: 2,
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([
      "proposition_valeur_avancement",
    ]);
  });

  test("proposition_valeur_avancement en NAT/REG utilise le set de roll-up, pas le compteur direct", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      nombre_propositions_valeur_actuelle: 0,
    };
    expect(
      categoriesDuChantier(chantier, "NAT", new Set(["CH-001"]), new Set()),
    ).toEqual(["proposition_valeur_avancement"]);
    expect(categoriesDuChantier(chantier, "NAT", new Set(), new Set())).toEqual([]);
  });

  test("regroupe plusieurs catégories pour un même chantier", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      tendance: "BAISSE",
      meteo: null,
      chantier_territoire_jalon: [{ ecart: -15, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "REG", new Set(), new Set())).toEqual([
      "meteo_synthese_non_renseignees",
      "retard_mediane",
      "tendance_baisse",
    ]);
  });
});
