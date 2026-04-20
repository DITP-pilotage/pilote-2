import { $Enums } from "@prisma/client";
import { DecisionStrategiqueV2 } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import {
  creerDecisionStrategiquePubliee,
  creerDecisionStrategiqueBrouillon,
  publierBrouillonDecisionStrategique,
  modifierDecisionStrategiquePubliee,
  modifierDecisionStrategiqueBrouillon,
} from "@/server/domain/chantier/décisionStratégique/DécisionStratégique";

const paramsCreation = {
  chantierId: "chantier-1",
  type: "suiviDesDecisionsStrategiques" as const,
  contenu: "contenu initial",
  auteurId: "auteur-1",
  date: "2026-01-01",
};

const paramsModification = {
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
};

function decisionAvecStatut(
  statut: $Enums.statut_publication,
): DecisionStrategiqueV2 {
  return {
    id: "decision-1",
    chantierId: "chantier-1",
    contenu: "contenu initial",
    statut,
    auteurCreationId: "auteur-1",
    auteurModificationId: "auteur-1",
    dateCreation: "2026-01-01",
    dateModification: "2026-01-01",
  };
}

describe("creerDecisionStrategiquePubliee", () => {
  it("crée une décision avec statut PUBLIE", () => {
    // when
    const result = creerDecisionStrategiquePubliee(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        contenu: paramsCreation.contenu,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });
});

describe("creerDecisionStrategiqueBrouillon", () => {
  it("crée une décision avec statut BROUILLON", () => {
    // when
    const result = creerDecisionStrategiqueBrouillon(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        contenu: paramsCreation.contenu,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });
});

describe("publierBrouillonDecisionStrategique", () => {
  it("publie un brouillon et retourne une décision PUBLIE", () => {
    // given
    const brouillon = decisionAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = publierBrouillonDecisionStrategique(
      brouillon,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette une décision déjà PUBLIE", () => {
    // given
    const publie = decisionAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      publierBrouillonDecisionStrategique(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});

describe("modifierDecisionStrategiquePubliee", () => {
  it("modifie une décision PUBLIE et retourne une décision PUBLIE", () => {
    // given
    const publie = decisionAvecStatut($Enums.statut_publication.PUBLIE);

    // when
    const result = modifierDecisionStrategiquePubliee(
      publie,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...publie,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette une décision BROUILLON", () => {
    // given
    const brouillon = decisionAvecStatut($Enums.statut_publication.BROUILLON);

    // then
    expect(() =>
      modifierDecisionStrategiquePubliee(brouillon, paramsModification),
    ).toThrow("Statut invalide : attendu PUBLIE, reçu BROUILLON");
  });
});

describe("modifierDecisionStrategiqueBrouillon", () => {
  it("modifie un brouillon et retourne une décision BROUILLON", () => {
    // given
    const brouillon = decisionAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = modifierDecisionStrategiqueBrouillon(
      brouillon,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.BROUILLON,
    });
  });

  it("rejette une décision PUBLIE", () => {
    // given
    const publie = decisionAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      modifierDecisionStrategiqueBrouillon(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});
