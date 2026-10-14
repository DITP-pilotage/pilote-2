import { motifsActionsIndisponibles } from "@/components/PageChantier/Publication/motifsActionsIndisponibles";
import {
  validationSynthèseDesRésultatsBrouillon,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";

const schemas = {
  draftSchema: validationSynthèseDesRésultatsBrouillon,
  publishSchema: validationSynthèseDesRésultatsFormulaire,
};

describe("motifsActionsIndisponibles", () => {
  it("bloque seulement la publication quand la météo manque", () => {
    // when
    const motifs = motifsActionsIndisponibles(
      { contenu: "<p>Synthèse</p>", meteo: undefined },
      schemas,
    );

    // then
    expect(motifs).toEqual({
      publier: ["La météo est obligatoire pour publier"],
      brouillon: [],
    });
  });

  it("bloque les deux actions quand le commentaire est vide, quelle que soit la météo", () => {
    // when
    const motifs = motifsActionsIndisponibles(
      { contenu: "<p>   </p>", meteo: "SOLEIL" },
      schemas,
    );

    // then
    expect(motifs).toEqual({
      publier: ["Le commentaire ne peut pas être vide"],
      brouillon: ["Le commentaire ne peut pas être vide"],
    });
  });

  it("ne bloque aucune action quand la météo et le commentaire sont saisis", () => {
    // when
    const motifs = motifsActionsIndisponibles(
      { contenu: "<p>Synthèse</p>", meteo: "SOLEIL" },
      schemas,
    );

    // then
    expect(motifs).toEqual({ publier: [], brouillon: [] });
  });
});
