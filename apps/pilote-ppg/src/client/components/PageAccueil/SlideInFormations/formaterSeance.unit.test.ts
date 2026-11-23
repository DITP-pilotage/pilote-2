import {
  formaterDebutSeance,
  formaterDuree,
  formaterPlacesRestantes,
} from "@/components/PageAccueil/SlideInFormations/formaterSeance";

describe("formaterDebutSeance", () => {
  it.each([
    ["2026-11-24T13:00:00Z", "Europe/Paris", "Mar. 24 nov., 14 h"],
    ["2026-12-01T09:30:00Z", "Europe/Paris", "Mar. 1er déc., 10 h 30"],
    ["2026-11-24T13:00:00Z", "Indian/Reunion", "Mar. 24 nov., 17 h"],
  ])("formate %s dans le fuseau %s", (dateDebut, timeZone, attendu) => {
    expect(formaterDebutSeance(dateDebut, timeZone)).toBe(attendu);
  });
});

describe("formaterDuree", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [90, "1 h 30"],
    [125, "2 h 05"],
  ])("formate %i minutes en « %s »", (dureeMinutes, attendu) => {
    expect(formaterDuree(dureeMinutes)).toBe(attendu);
  });
});

describe("formaterPlacesRestantes", () => {
  it.each([
    [null, null],
    [6, null],
    [5, "Plus que 5 places"],
    [1, "Plus qu'une place"],
  ])("formate %s places restantes", (placesRestantes, attendu) => {
    expect(formaterPlacesRestantes(placesRestantes)).toBe(attendu);
  });
});
