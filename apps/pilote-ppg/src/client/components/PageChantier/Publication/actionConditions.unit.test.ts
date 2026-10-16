import { actionConditions } from "@/components/PageChantier/Publication/actionConditions";
import {
  validationSynthèseDesRésultatsBrouillon,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";

const labels = { contenu: "Commentaire", meteo: "Météo" };

describe("actionConditions", () => {
  it("n'exige pas la météo pour un brouillon", () => {
    // when
    const conditions = actionConditions(
      validationSynthèseDesRésultatsBrouillon,
      { contenu: "<p>Synthèse</p>", meteo: undefined },
      labels,
    );

    // then
    expect(conditions).toEqual([
      { field: "contenu", label: "Commentaire", met: true },
    ]);
  });

  it("exige la météo pour publier", () => {
    // when
    const conditions = actionConditions(
      validationSynthèseDesRésultatsFormulaire,
      { contenu: "<p>Synthèse</p>", meteo: undefined },
      labels,
    );

    // then
    expect(conditions).toEqual([
      { field: "contenu", label: "Commentaire", met: true },
      { field: "meteo", label: "Météo", met: false },
    ]);
  });

  it("considère un commentaire vide comme non rempli", () => {
    // when
    const conditions = actionConditions(
      validationSynthèseDesRésultatsFormulaire,
      { contenu: "<p>   </p>", meteo: "SOLEIL" },
      labels,
    );

    // then
    expect(conditions).toEqual([
      { field: "contenu", label: "Commentaire", met: false },
      { field: "meteo", label: "Météo", met: true },
    ]);
  });

  it("considère un commentaire au-delà de la limite comme non rempli", () => {
    // when
    const conditions = actionConditions(
      validationSynthèseDesRésultatsBrouillon,
      { contenu: `<p>${"a".repeat(1001)}</p>`, meteo: undefined },
      labels,
    );

    // then
    expect(conditions).toEqual([
      { field: "contenu", label: "Commentaire", met: false },
    ]);
  });
});
