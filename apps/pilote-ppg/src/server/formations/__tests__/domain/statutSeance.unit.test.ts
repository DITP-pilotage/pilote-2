import { statutSeance } from "@/server/formations/domain/statutSeance";

describe("statutSeance", () => {
  it("est annulée dès qu'une date d'annulation existe, même pleine", () => {
    expect(
      statutSeance({
        dateAnnulation: new Date("2026-11-10T09:00:00Z"),
        nombreInscrits: 20,
        nombrePlacesMax: 20,
      }),
    ).toEqual("ANNULEE");
  });

  it("est complète quand les inscrits atteignent ou dépassent la limite", () => {
    expect(
      statutSeance({
        dateAnnulation: null,
        nombreInscrits: 20,
        nombrePlacesMax: 20,
      }),
    ).toEqual("COMPLETE");
    expect(
      statutSeance({
        dateAnnulation: null,
        nombreInscrits: 21,
        nombrePlacesMax: 20,
      }),
    ).toEqual("COMPLETE");
  });

  it("est ouverte sous la limite", () => {
    expect(
      statutSeance({
        dateAnnulation: null,
        nombreInscrits: 12,
        nombrePlacesMax: 20,
      }),
    ).toEqual("OUVERTE");
  });

  it("est ouverte quand RDV-SP ne fixe pas de limite de places", () => {
    expect(
      statutSeance({
        dateAnnulation: null,
        nombreInscrits: 50,
        nombrePlacesMax: null,
      }),
    ).toEqual("OUVERTE");
  });
});
