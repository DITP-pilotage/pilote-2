import { categorieDepuisRouteurTRPC } from "@/server/framework/trpc/categorieLogRouteurTRPC";

describe("categorieDepuisRouteurTRPC", () => {
  it.each([
    { path: "chantier.recupererChantier", attendu: "chantier" },
    { path: "syntheseDesResultats.creer", attendu: "chantier" },
    { path: "metadataPorteur.lister", attendu: "referentiel" },
    { path: "perimetreMinisteriel.recupererTous", attendu: "referentiel" },
    { path: "albert.envoyerMessage", attendu: "albert" },
    { path: "applicationLog.lister", attendu: "maintenance" },
    { path: "gestionTokenAPI.creerToken", attendu: "auth" },
    { path: "annuaire.coordinateurs", attendu: "utilisateur" },
  ])("associe le path $path a la categorie $attendu", ({ path, attendu }) => {
    expect(categorieDepuisRouteurTRPC(path)).toBe(attendu);
  });

  it.each([
    { cas: "un routeur inconnu", path: "routeurInexistant.uneProcedure" },
    { cas: "un path vide", path: "" },
    { cas: "un path absent", path: undefined },
  ])("retourne systeme pour $cas", ({ path }) => {
    expect(categorieDepuisRouteurTRPC(path)).toBe("systeme");
  });
});
