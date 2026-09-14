import { describe, expect, test } from "vitest";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { prepareHistoriqueIndicateurTerritoire } from "@/server/albert/tools/prepareHistoriqueIndicateurTerritoire";

const construireEvenement = <T extends string>({
  id,
  typeEvenement,
  valeur,
  dateValeur,
  dateCreation,
  ordre,
  donneesComplementaires,
}: {
  id: string;
  typeEvenement: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valeur: any;
  dateValeur: string;
  dateCreation: string;
  ordre: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  donneesComplementaires?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any =>
  IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
    {
      id,
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeEvenement: typeEvenement as any,
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: new Date(dateValeur),
      valeur,
      donneesComplementaires,
      idAuteurModification: "AUTEUR-1",
      correlationId: "CORR-1",
      ordre,
      dateCreation: new Date(dateCreation),
    },
  );

describe("prepareHistoriqueIndicateurTerritoire", () => {
  test("traduit VALEUR_CREEE en libellé lisible", () => {
    // Given
    const evenement = construireEvenement({
      id: "1",
      typeEvenement: "VALEUR_CREEE",
      valeur: 18,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire([evenement], {
      perimetre: "tout",
    });

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-05-01",
        dateCreation: "2024-05-01T10:00:00.000Z",
        libelle: "Nouvelle valeur affichée dans PILOTE : 18",
      },
    ]);
  });

  test("indique la suppression quand VALEUR_MODIFIEE porte une valeur nulle", () => {
    // Given
    const evenement = construireEvenement({
      id: "1",
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: null,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire([evenement], {
      perimetre: "tout",
    });

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-05-01",
        dateCreation: "2024-05-01T10:00:00.000Z",
        libelle:
          "Import de données par la direction de projet : la valeur a été supprimée de PILOTE",
      },
    ]);
  });

  test("le périmètre valeur_affichee exclut les propositions en cours mais inclut les propositions acceptées", () => {
    // Given
    const propositionCreee = construireEvenement({
      id: "1",
      typeEvenement: "PROPOSITION_VALEUR_CREEE",
      valeur: 20,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
      donneesComplementaires: { motif: "avancement des travaux" },
    });
    const propositionAcceptee = construireEvenement({
      id: "2",
      typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
      valeur: 20,
      dateValeur: "2024-06-01",
      dateCreation: "2024-06-05T10:00:00.000Z",
      ordre: 1,
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire(
      [propositionCreee, propositionAcceptee],
      { perimetre: "valeur_affichee" },
    );

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-06-01",
        dateCreation: "2024-06-05T10:00:00.000Z",
        libelle:
          "Proposition acceptée par la direction de projet : nouvelle valeur affichée dans PILOTE : 20",
      },
    ]);
  });

  test("le périmètre propositions exclut les imports directs de valeur", () => {
    // Given
    const valeurModifiee = construireEvenement({
      id: "1",
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: 15,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
    });
    const propositionRefusee = construireEvenement({
      id: "2",
      typeEvenement: "PROPOSITION_VALEUR_REFUSEE",
      valeur: 20,
      dateValeur: "2024-06-01",
      dateCreation: "2024-06-05T10:00:00.000Z",
      ordre: 1,
      donneesComplementaires: { motif: "données non fiables" },
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire(
      [valeurModifiee, propositionRefusee],
      { perimetre: "propositions" },
    );

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-06-01",
        dateCreation: "2024-06-05T10:00:00.000Z",
        libelle: "Proposition refusée par la direction de projet",
        motif: "données non fiables",
      },
    ]);
  });

  test("exclut les événements hors de la plage de dates demandée", () => {
    // Given
    const evenementAvant = construireEvenement({
      id: "1",
      typeEvenement: "VALEUR_CREEE",
      valeur: 10,
      dateValeur: "2023-01-01",
      dateCreation: "2023-01-01T10:00:00.000Z",
      ordre: 1,
    });
    const evenementDansLaPlage = construireEvenement({
      id: "2",
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: 15,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire(
      [evenementAvant, evenementDansLaPlage],
      {
        perimetre: "tout",
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-12-31"),
      },
    );

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-05-01",
        dateCreation: "2024-05-01T10:00:00.000Z",
        libelle:
          "Import de données par la direction de projet : nouvelle valeur affichée dans PILOTE : 15",
      },
    ]);
  });

  test("déduplique le VALEUR_MODIFIEE technique généré par une proposition acceptée", () => {
    // Given — même date_valeur, la proposition acceptée a un ordre supérieur
    // (créée juste après le VALEUR_MODIFIEE système sur le même import)
    const valeurModifieeTechnique = construireEvenement({
      id: "1",
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: 20,
      dateValeur: "2024-06-01",
      dateCreation: "2024-06-05T10:00:00.000Z",
      ordre: 1,
    });
    const propositionAcceptee = construireEvenement({
      id: "2",
      typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
      valeur: 20,
      dateValeur: "2024-06-01",
      dateCreation: "2024-06-05T10:00:01.000Z",
      ordre: 2,
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire(
      [valeurModifieeTechnique, propositionAcceptee],
      { perimetre: "valeur_affichee" },
    );

    // Then — seule la proposition acceptée est restituée, pas l'écho technique
    expect(resultat).toEqual([
      {
        dateValeur: "2024-06-01",
        dateCreation: "2024-06-05T10:00:01.000Z",
        libelle:
          "Proposition acceptée par la direction de projet : nouvelle valeur affichée dans PILOTE : 20",
      },
    ]);
  });

  test("transmet le motif et la méthode de calcul pour une proposition créée", () => {
    // Given
    const proposition = construireEvenement({
      id: "1",
      typeEvenement: "PROPOSITION_VALEUR_CREEE",
      valeur: 25,
      dateValeur: "2024-05-01",
      dateCreation: "2024-05-01T10:00:00.000Z",
      ordre: 1,
      donneesComplementaires: {
        motif: "nouvelles données terrain",
        sourceDonneeEtMethodeCalcul: "extraction SI local",
      },
    });

    // When
    const resultat = prepareHistoriqueIndicateurTerritoire([proposition], {
      perimetre: "propositions",
    });

    // Then
    expect(resultat).toEqual([
      {
        dateValeur: "2024-05-01",
        dateCreation: "2024-05-01T10:00:00.000Z",
        libelle: "Nouvelle proposition du territoire : 25",
        motif: "nouvelles données terrain",
        sourceDonneeEtMethodeCalcul: "extraction SI local",
      },
    ]);
  });
});
