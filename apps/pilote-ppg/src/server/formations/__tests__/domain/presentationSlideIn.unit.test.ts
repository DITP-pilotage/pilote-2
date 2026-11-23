import { nomAffiche } from "@/server/formations/domain/presentationSlideIn";

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
