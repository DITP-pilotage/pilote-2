import {
  doitPresenterSlideIn,
  nomAffiche,
} from "@/server/formations/domain/presentationSlideIn";

const maintenant = new Date("2026-11-23T10:00:00Z");

describe("doitPresenterSlideIn", () => {
  it("présente la slide-in jamais présentée", () => {
    expect(doitPresenterSlideIn(null, maintenant)).toBe(true);
  });

  it("présente à nouveau la slide-in présentée sans action", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: null, dateFermeture: null },
        maintenant,
      ),
    ).toBe(true);
  });

  it("ne présente plus la slide-in fermée, même reportée il y a longtemps", () => {
    expect(
      doitPresenterSlideIn(
        {
          dateReport: new Date("2026-10-01T10:00:00Z"),
          dateFermeture: new Date("2026-11-22T10:00:00Z"),
        },
        maintenant,
      ),
    ).toBe(false);
  });

  it("ne présente pas la slide-in reportée il y a moins de 7 jours", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: new Date("2026-11-16T10:00:01Z"), dateFermeture: null },
        maintenant,
      ),
    ).toBe(false);
  });

  it("présente la slide-in reportée il y a 7 jours tout juste", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: new Date("2026-11-16T10:00:00Z"), dateFermeture: null },
        maintenant,
      ),
    ).toBe(true);
  });
});

describe("nomAffiche", () => {
  it.each([
    ["CAMPUS PILOTE : Introduction à l'outil", "Introduction à l'outil"],
    [
      "CAP sur PILOTE : Devenir un coordinateur efficace",
      "Devenir un coordinateur efficace",
    ],
    ["Atelier : budget : niveau 2", "budget : niveau 2"],
    ["Formation sans préfixe", "Formation sans préfixe"],
    ["Préfixe seul :", "Préfixe seul :"],
  ])("affiche « %s » comme « %s »", (nom, attendu) => {
    expect(nomAffiche(nom)).toBe(attendu);
  });
});
