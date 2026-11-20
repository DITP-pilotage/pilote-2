import { verifierEnvoi } from "@/server/formations/domain/envoiFormations";

describe("verifierEnvoi", () => {
  it("accepte un envoi dont chaque séance référence un motif de l'envoi", () => {
    // When
    const erreurs = verifierEnvoi({
      motifs: [{ id: 2101 }, { id: 2102 }],
      seances: [
        { id: 884501, motif_id: 2101 },
        { id: 884502, motif_id: 2101 },
      ],
    });

    // Then
    expect(erreurs).toEqual([]);
  });

  it("refuse un envoi sans motif", () => {
    // When
    const erreurs = verifierEnvoi({ motifs: [], seances: [] });

    // Then
    expect(erreurs).toEqual([
      { chemin: "motifs", message: "Au moins un motif est attendu." },
    ]);
  });

  it("signale les motifs et les séances en double", () => {
    // When
    const erreurs = verifierEnvoi({
      motifs: [{ id: 2101 }, { id: 2101 }],
      seances: [
        { id: 884501, motif_id: 2101 },
        { id: 884501, motif_id: 2101 },
      ],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "motifs.1.id",
        message: "Le motif 2101 apparaît plusieurs fois.",
      },
      {
        chemin: "seances.1.id",
        message: "La séance 884501 apparaît plusieurs fois.",
      },
    ]);
  });

  it("signale une séance dont le motif ne fait pas partie de l'envoi", () => {
    // When
    const erreurs = verifierEnvoi({
      motifs: [{ id: 2101 }],
      seances: [{ id: 884501, motif_id: 2107 }],
    });

    // Then
    expect(erreurs).toEqual([
      {
        chemin: "seances.0.motif_id",
        message: "Le motif 2107 ne fait pas partie de l'envoi.",
      },
    ]);
  });
});
