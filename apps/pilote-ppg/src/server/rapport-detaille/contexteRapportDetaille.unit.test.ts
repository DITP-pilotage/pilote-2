import { construireContexteRapportDetaille } from "@/server/rapport-detaille/contexteRapportDetaille";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";
import { sessionDeTest } from "@/server/rapport-detaille/sessionDeTest";

const session = sessionDeTest();

describe("construireContexteRapportDetaille", () => {
  it("en national, la maille sélectionnée vient du query param et la maille chantier est nationale", () => {
    const contexte = construireContexteRapportDetaille(
      { maille: "regionale" },
      "NAT-FR",
      session,
    );
    expect(contexte.mailleSelectionnee).toBe("regionale");
    expect(contexte.mailleChantier).toBe("nationale");
    expect(contexte.codeInseeSelectionne).toBe("FR");
  });

  it("sur un département, les deux mailles sont départementales", () => {
    const contexte = construireContexteRapportDetaille({}, "DEPT-75", session);
    expect([contexte.mailleSelectionnee, contexte.mailleChantier]).toEqual([
      "departementale",
      "departementale",
    ]);
  });

  it("sur une région, les deux mailles sont régionales", () => {
    const contexte = construireContexteRapportDetaille({}, "REG-11", session);
    expect([contexte.mailleSelectionnee, contexte.mailleChantier]).toEqual([
      "regionale",
      "regionale",
    ]);
  });

  it("sans statut, seuls les chantiers publiés sont demandés", () => {
    expect(
      construireContexteRapportDetaille({}, "NAT-FR", session).filtres.statut,
    ).toEqual(["PUBLIE"]);
  });

  it("BROUILLON_ET_PUBLIE demande les brouillons et les publiés", () => {
    expect(
      construireContexteRapportDetaille(
        { statut: "BROUILLON_ET_PUBLIE" },
        "NAT-FR",
        session,
      ).filtres.statut,
    ).toEqual(["BROUILLON", "PUBLIE"]);
  });

  it("le jalon par défaut dépend de la date de bascule", () => {
    const contexte = construireContexteRapportDetaille(
      {},
      "NAT-FR",
      session,
      new Date("2026-10-01T10:00:00Z"),
    );
    expect(contexte.jalon).toBe(contexte.jalonParDefaut);
    expect(
      construireContexteRapportDetaille({ jalon: "2025" }, "NAT-FR", session)
        .jalon,
    ).toBe(2025);
  });

  it("detail=true active le détail des chantiers", () => {
    expect(
      construireContexteRapportDetaille({ detail: "true" }, "NAT-FR", session)
        .afficherDetail,
    ).toBe(true);
    expect(
      construireContexteRapportDetaille({}, "NAT-FR", session).afficherDetail,
    ).toBe(false);
  });

  it("le tri par défaut est celui de l'accueil", () => {
    expect(
      construireContexteRapportDetaille({}, "NAT-FR", session).sorting,
    ).toEqual(TRI_CHANTIERS_PAR_DEFAUT);
  });

  it("les filtres d'alertes sont lus depuis la query", () => {
    const contexte = construireContexteRapportDetaille(
      { estEnAlerteBaisse: "true" },
      "NAT-FR",
      session,
    );
    expect(contexte.filtresAlertes.estEnAlerteBaisse).toBe(true);
    expect(contexte.filtresAlertes.estEnAlerteÉcart).toBe(false);
  });
});
