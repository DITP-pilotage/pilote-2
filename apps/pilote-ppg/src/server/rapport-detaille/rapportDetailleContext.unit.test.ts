import { buildRapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";
import { buildTestSession } from "@/server/rapport-detaille/testSession";

const session = buildTestSession();

describe("buildRapportDetailleContext", () => {
  it("en national, la maille sélectionnée vient du query param et la maille chantier est nationale", () => {
    const context = buildRapportDetailleContext(
      { maille: "regionale" },
      "NAT-FR",
      session,
    );
    expect(context.selectedMaille).toBe("regionale");
    expect(context.chantierMaille).toBe("nationale");
    expect(context.selectedCodeInsee).toBe("FR");
  });

  it("sur un département, les deux mailles sont départementales", () => {
    const context = buildRapportDetailleContext({}, "DEPT-75", session);
    expect([context.selectedMaille, context.chantierMaille]).toEqual([
      "departementale",
      "departementale",
    ]);
  });

  it("sur une région, les deux mailles sont régionales", () => {
    const context = buildRapportDetailleContext({}, "REG-11", session);
    expect([context.selectedMaille, context.chantierMaille]).toEqual([
      "regionale",
      "regionale",
    ]);
  });

  it("sans statut, seuls les chantiers publiés sont demandés", () => {
    expect(
      buildRapportDetailleContext({}, "NAT-FR", session).filtres.statut,
    ).toEqual(["PUBLIE"]);
  });

  it("BROUILLON_ET_PUBLIE demande les brouillons et les publiés", () => {
    expect(
      buildRapportDetailleContext(
        { statut: "BROUILLON_ET_PUBLIE" },
        "NAT-FR",
        session,
      ).filtres.statut,
    ).toEqual(["BROUILLON", "PUBLIE"]);
  });

  it("le jalon par défaut dépend de la date de bascule", () => {
    const context = buildRapportDetailleContext(
      {},
      "NAT-FR",
      session,
      new Date("2026-10-01T10:00:00Z"),
    );
    expect(context.jalon).toBe(context.defaultJalon);
    expect(
      buildRapportDetailleContext({ jalon: "2025" }, "NAT-FR", session).jalon,
    ).toBe(2025);
  });

  it("detail=true active le détail des chantiers", () => {
    expect(
      buildRapportDetailleContext({ detail: "true" }, "NAT-FR", session)
        .showDetail,
    ).toBe(true);
    expect(buildRapportDetailleContext({}, "NAT-FR", session).showDetail).toBe(
      false,
    );
  });

  it("le tri par défaut est celui de l'accueil", () => {
    expect(buildRapportDetailleContext({}, "NAT-FR", session).sorting).toEqual(
      TRI_CHANTIERS_PAR_DEFAUT,
    );
  });

  it("les filtres d'alertes sont lus depuis la query", () => {
    const context = buildRapportDetailleContext(
      { estEnAlerteBaisse: "true" },
      "NAT-FR",
      session,
    );
    expect(context.alerteFilters.estEnAlerteBaisse).toBe(true);
    expect(context.alerteFilters.estEnAlerteÉcart).toBe(false);
  });
});
